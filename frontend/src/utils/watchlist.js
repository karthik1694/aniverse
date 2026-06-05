/**
 * Watchlist manager (localStorage based).
 * Works for everyone - anonymous and logged-in users - with zero backend cost.
 * Tracks status + episode progress per anime.
 */

const STORAGE_KEY = 'otaku_watchlist_v1';

export const WATCH_STATUS = {
  WATCHING: 'watching',
  COMPLETED: 'completed',
  PLAN: 'plan_to_watch',
  ON_HOLD: 'on_hold',
  DROPPED: 'dropped',
};

export const STATUS_LABELS = {
  watching: 'Watching',
  completed: 'Completed',
  plan_to_watch: 'Plan to Watch',
  on_hold: 'On Hold',
  dropped: 'Dropped',
};

export const STATUS_ORDER = ['watching', 'plan_to_watch', 'completed', 'on_hold', 'dropped'];

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Let other components in the app know the watchlist changed
    window.dispatchEvent(new CustomEvent('watchlist:changed'));
  } catch (e) {
    console.error('Failed to save watchlist', e);
  }
}

export const watchlist = {
  getAll() {
    return Object.values(read()).sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );
  },

  getByStatus(status) {
    return watchlist.getAll().filter((i) => i.status === status);
  },

  get(malId) {
    return read()[String(malId)] || null;
  },

  isInList(malId) {
    return !!read()[String(malId)];
  },

  upsert(anime, status = WATCH_STATUS.PLAN) {
    const data = read();
    const key = String(anime.mal_id);
    const existing = data[key] || {};
    data[key] = {
      mal_id: anime.mal_id,
      title: anime.title,
      slug: anime.slug,
      image_url: anime.image_url,
      episodes: anime.episodes ?? existing.episodes ?? null,
      genres: anime.genres && anime.genres.length ? anime.genres : (existing.genres || []),
      status,
      progress: existing.progress || 0,
      score: existing.score || null,
      updated_at: new Date().toISOString(),
      added_at: existing.added_at || new Date().toISOString(),
    };
    write(data);
    return data[key];
  },

  setStatus(malId, status) {
    const data = read();
    const key = String(malId);
    if (data[key]) {
      data[key].status = status;
      data[key].updated_at = new Date().toISOString();
      write(data);
    }
  },

  setProgress(malId, progress) {
    const data = read();
    const key = String(malId);
    if (data[key]) {
      data[key].progress = Math.max(0, progress);
      data[key].updated_at = new Date().toISOString();
      // Auto-complete when reaching total episodes
      if (data[key].episodes && data[key].progress >= data[key].episodes) {
        data[key].status = WATCH_STATUS.COMPLETED;
      }
      write(data);
    }
  },

  setScore(malId, score) {
    const data = read();
    const key = String(malId);
    if (data[key]) {
      data[key].score = score;
      data[key].updated_at = new Date().toISOString();
      write(data);
    }
  },

  remove(malId) {
    const data = read();
    delete data[String(malId)];
    write(data);
  },

  stats() {
    const all = watchlist.getAll();
    const byStatus = {};
    STATUS_ORDER.forEach((s) => {
      byStatus[s] = all.filter((i) => i.status === s).length;
    });
    const episodesWatched = all.reduce((sum, i) => sum + (i.progress || 0), 0);
    return { total: all.length, byStatus, episodesWatched };
  },

  /**
   * Build a compact "taste profile" from the watchlist for stranger matching.
   * Sent to the backend so users are paired by what they actually watch:
   * shared shows, currently-watching overlap, genre affinity, and activity level.
   */
  matchProfile() {
    const all = watchlist.getAll().slice(0, 200); // cap payload
    const watch_ids = [];
    const watching_ids = [];
    const completed_ids = [];
    const titles = {};
    const genreCounts = {};

    all.forEach((e) => {
      watch_ids.push(e.mal_id);
      titles[e.mal_id] = e.title;
      if (e.status === WATCH_STATUS.WATCHING) watching_ids.push(e.mal_id);
      if (e.status === WATCH_STATUS.COMPLETED) completed_ids.push(e.mal_id);
      (e.genres || []).forEach((g) => {
        if (g) genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });

    const genres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([g]) => g);

    const s = watchlist.stats();
    return {
      watch_ids,
      watching_ids,
      completed_ids,
      genres,
      titles,
      stats: {
        completed: s.byStatus.completed || 0,
        watching: s.byStatus.watching || 0,
        episodes: s.episodesWatched || 0,
        total: s.total || 0,
      },
    };
  },
};
