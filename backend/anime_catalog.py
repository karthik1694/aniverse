"""
Anime Catalog Service
=====================
Lightweight async client for the free Jikan API (unofficial MyAnimeList API).
No API key required, no budget needed.

Includes an in-memory TTL cache so we respect Jikan's rate limits
(~3 requests/second, 60/minute) and keep our pages fast + SEO friendly.

Docs: https://docs.api.jikan.moe/
"""

import os
import json
import time
import asyncio
import logging
import httpx
from typing import Any, Dict, List, Optional

# Optional persistent cache. redis-py ships an async client. If the package is
# missing or REDIS_URL is unset, we silently fall back to the in-memory cache.
try:
    import redis.asyncio as aioredis
except ImportError:  # pragma: no cover
    aioredis = None

logger = logging.getLogger(__name__)

JIKAN_BASE = "https://api.jikan.moe/v4"

# ---------------------------------------------------------------------------
# Two-tier TTL cache: L1 in-memory (fast, per-instance) + L2 Redis (persistent,
# shared, survives restarts). Redis is optional — set REDIS_URL (e.g. an Upstash
# rediss:// URL) to enable it. Without it, only the in-memory tier is used.
# ---------------------------------------------------------------------------
_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_LOCK = asyncio.Lock()

# How long an item pulled from Redis is mirrored in the (faster) memory tier.
_MEMORY_BACKFILL_TTL = 600  # seconds

# ---- Redis (L2) configuration ----
REDIS_URL = os.environ.get("REDIS_URL", "").strip()
REDIS_KEY_PREFIX = "otaku:catalog:"
_redis_client: Optional["aioredis.Redis"] = None
_redis_enabled = bool(REDIS_URL) and aioredis is not None
_redis_unavailable = False  # flips True after a failure so we stop retrying


async def _get_redis() -> Optional["aioredis.Redis"]:
    """Lazily connect to Redis. Returns None (and disables Redis) on any failure
    so a cache outage can never take down catalog endpoints."""
    global _redis_client, _redis_unavailable
    if not _redis_enabled or _redis_unavailable:
        return None
    if _redis_client is None:
        try:
            _redis_client = aioredis.from_url(
                REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
            )
            await _redis_client.ping()
            logger.info("✅ Redis (L2) cache connected")
        except Exception as e:
            logger.warning(f"Redis unavailable, using in-memory cache only: {e}")
            _redis_client = None
            _redis_unavailable = True
            return None
    return _redis_client

# A single shared client + a lock to gently serialize bursts of requests
_client: Optional[httpx.AsyncClient] = None
_request_lock = asyncio.Lock()
_last_request_ts = 0.0
_MIN_INTERVAL = 0.40  # ~2.5 req/sec, safely under Jikan's limit


async def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(15.0),
            headers={"User-Agent": "OtakuCafe/1.0 (+https://otakucafe.fun)"},
        )
    return _client


async def close_client():
    global _client, _redis_client
    if _client is not None:
        await _client.aclose()
        _client = None
    if _redis_client is not None:
        try:
            await _redis_client.aclose()
        except Exception:
            pass
        _redis_client = None


def _cache_set_memory(key: str, data: Any, ttl: int):
    _CACHE[key] = {"data": data, "expires": time.time() + ttl}


def _cache_get_memory(key: str) -> Optional[Any]:
    entry = _CACHE.get(key)
    if not entry:
        return None
    if entry["expires"] < time.time():
        _CACHE.pop(key, None)
        return None
    return entry["data"]


async def _cache_get(key: str) -> Optional[Any]:
    """Look up a key in L1 (memory) then L2 (Redis). A Redis hit backfills L1."""
    # L1: in-memory
    mem = _cache_get_memory(key)
    if mem is not None:
        return mem

    # L2: Redis (optional)
    r = await _get_redis()
    if r is not None:
        try:
            raw = await r.get(REDIS_KEY_PREFIX + key)
            if raw is not None:
                data = json.loads(raw)
                _cache_set_memory(key, data, _MEMORY_BACKFILL_TTL)
                return data
        except Exception as e:
            logger.warning(f"Redis get failed for {key}: {e}")
    return None


async def _cache_set(key: str, data: Any, ttl: int):
    """Write through to both tiers."""
    _cache_set_memory(key, data, ttl)
    r = await _get_redis()
    if r is not None:
        try:
            await r.set(REDIS_KEY_PREFIX + key, json.dumps(data), ex=ttl)
        except Exception as e:
            logger.warning(f"Redis set failed for {key}: {e}")


async def _fetch(path: str, params: Optional[Dict[str, Any]] = None,
                 ttl: int = 3600) -> Optional[Dict[str, Any]]:
    """Fetch a Jikan endpoint with caching + light rate limiting."""
    global _last_request_ts
    cache_key = f"{path}?{params}"

    cached = await _cache_get(cache_key)
    if cached is not None:
        return cached

    client = await _get_client()

    # Gentle rate limiting so we never trip Jikan's 429s
    async with _request_lock:
        elapsed = time.time() - _last_request_ts
        if elapsed < _MIN_INTERVAL:
            await asyncio.sleep(_MIN_INTERVAL - elapsed)

        for attempt in range(3):
            try:
                resp = await client.get(f"{JIKAN_BASE}{path}", params=params)
                _last_request_ts = time.time()

                if resp.status_code == 429:
                    # Rate limited - back off and retry
                    wait = 1.5 * (attempt + 1)
                    logger.warning(f"Jikan 429 on {path}, backing off {wait}s")
                    await asyncio.sleep(wait)
                    continue

                resp.raise_for_status()
                data = resp.json()
                await _cache_set(cache_key, data, ttl)
                return data
            except httpx.HTTPStatusError as e:
                logger.warning(f"Jikan HTTP error on {path}: {e}")
                if e.response.status_code == 404:
                    return None
                await asyncio.sleep(0.6 * (attempt + 1))
            except Exception as e:
                logger.warning(f"Jikan request failed on {path}: {e}")
                await asyncio.sleep(0.6 * (attempt + 1))

    # If a stale cached value exists, prefer it over nothing
    stale = _CACHE.get(cache_key)
    return stale["data"] if stale else None


# ---------------------------------------------------------------------------
# Normalizers - keep payloads slim + consistent for the frontend
# ---------------------------------------------------------------------------
def slugify(text: str) -> str:
    if not text:
        return "anime"
    out = []
    prev_dash = False
    for ch in text.lower():
        if ch.isalnum():
            out.append(ch)
            prev_dash = False
        elif not prev_dash:
            out.append("-")
            prev_dash = True
    return "".join(out).strip("-") or "anime"


def normalize_anime(item: Dict[str, Any], full: bool = False) -> Dict[str, Any]:
    if not item:
        return {}
    images = item.get("images", {}) or {}
    jpg = images.get("jpg", {}) or {}
    webp = images.get("webp", {}) or {}

    title = item.get("title_english") or item.get("title") or "Unknown"

    data = {
        "mal_id": item.get("mal_id"),
        "title": title,
        "title_original": item.get("title"),
        "slug": slugify(title),
        "image_url": (
            webp.get("large_image_url")
            or jpg.get("large_image_url")
            or jpg.get("image_url")
        ),
        "type": item.get("type"),
        "episodes": item.get("episodes"),
        "score": item.get("score"),
        "year": item.get("year"),
        "season": item.get("season"),
        "status": item.get("status"),
        "genres": [g.get("name") for g in (item.get("genres") or [])],
        "members": item.get("members"),
        "rank": item.get("rank"),
        "popularity": item.get("popularity"),
    }

    if full:
        aired = item.get("aired", {}) or {}
        data.update({
            "synopsis": item.get("synopsis"),
            "background": item.get("background"),
            "themes": [t.get("name") for t in (item.get("themes") or [])],
            "studios": [s.get("name") for s in (item.get("studios") or [])],
            "demographics": [d.get("name") for d in (item.get("demographics") or [])],
            "rating": item.get("rating"),
            "duration": item.get("duration"),
            "aired_from": aired.get("from"),
            "aired_string": aired.get("string"),
            "source": item.get("source"),
            "trailer_url": (item.get("trailer") or {}).get("url"),
            "trailer_embed": (item.get("trailer") or {}).get("embed_url"),
            "title_japanese": item.get("title_japanese"),
            "scored_by": item.get("scored_by"),
            "favorites": item.get("favorites"),
            "broadcast": (item.get("broadcast") or {}).get("string"),
        })

    return data


def _normalize_list(payload: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not payload:
        return []
    return [normalize_anime(x) for x in payload.get("data", []) if x]


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------
async def get_seasonal(limit: int = 24) -> List[Dict[str, Any]]:
    payload = await _fetch("/seasons/now", {"limit": limit, "sfw": "true"}, ttl=6 * 3600)
    seen, result = set(), []
    for a in _normalize_list(payload):
        if a["mal_id"] in seen:
            continue
        seen.add(a["mal_id"])
        result.append(a)
    return result[:limit]


async def get_top(limit: int = 24, filter_type: Optional[str] = None) -> List[Dict[str, Any]]:
    params: Dict[str, Any] = {"limit": limit, "sfw": "true"}
    if filter_type:
        params["filter"] = filter_type  # airing, upcoming, bypopularity, favorite
    payload = await _fetch("/top/anime", params, ttl=6 * 3600)
    return _normalize_list(payload)


async def search(query: str, limit: int = 24) -> List[Dict[str, Any]]:
    if not query or not query.strip():
        return []
    payload = await _fetch(
        "/anime",
        {"q": query.strip(), "limit": limit, "sfw": "true", "order_by": "members", "sort": "desc"},
        ttl=3600,
    )
    return _normalize_list(payload)


async def get_schedule() -> Dict[str, List[Dict[str, Any]]]:
    """Weekly airing schedule grouped by day of week."""
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    schedule: Dict[str, List[Dict[str, Any]]] = {}
    for day in days:
        payload = await _fetch("/schedules", {"filter": day, "limit": 20, "sfw": "true"}, ttl=6 * 3600)
        seen, items = set(), []
        for a in _normalize_list(payload):
            if a["mal_id"] in seen:
                continue
            seen.add(a["mal_id"])
            items.append(a)
        schedule[day] = items
    return schedule


async def get_anime(mal_id: int) -> Optional[Dict[str, Any]]:
    payload = await _fetch(f"/anime/{mal_id}/full", ttl=24 * 3600)
    if not payload or "data" not in payload:
        return None
    return normalize_anime(payload["data"], full=True)


async def get_episodes(mal_id: int, page: int = 1) -> Dict[str, Any]:
    payload = await _fetch(f"/anime/{mal_id}/episodes", {"page": page}, ttl=12 * 3600)
    if not payload:
        return {"episodes": [], "has_next_page": False}
    episodes = []
    for ep in payload.get("data", []):
        episodes.append({
            "mal_id": ep.get("mal_id"),
            "number": ep.get("mal_id"),
            "title": ep.get("title"),
            "title_japanese": ep.get("title_japanese"),
            "aired": ep.get("aired"),
            "score": ep.get("score"),
            "filler": ep.get("filler"),
            "recap": ep.get("recap"),
        })
    pagination = payload.get("pagination", {}) or {}
    return {
        "episodes": episodes,
        "has_next_page": pagination.get("has_next_page", False),
        "last_page": pagination.get("last_visible_page", 1),
    }


async def get_recommendations(mal_id: int, limit: int = 12) -> List[Dict[str, Any]]:
    payload = await _fetch(f"/anime/{mal_id}/recommendations", ttl=24 * 3600)
    if not payload:
        return []
    result, seen = [], set()
    for rec in payload.get("data", []):
        entry = rec.get("entry", {})
        if not entry or entry.get("mal_id") in seen:
            continue
        seen.add(entry.get("mal_id"))
        result.append(normalize_anime(entry))
        if len(result) >= limit:
            break
    return result
