import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, Plus, Check, ChevronDown, Calendar, Film, Users as UsersIcon,
  Play, MessageSquare, ArrowLeft, Clock, Tv,
} from 'lucide-react';
import { toast } from 'sonner';
import { catalogApi } from '../api/catalog';
import { watchlist, STATUS_LABELS, STATUS_ORDER } from '../utils/watchlist';
import DiscussionThread from '../components/DiscussionThread';
import AnimeCard from '../components/AnimeCard';
import useSeo, { BASE_URL } from '../hooks/useSeo';

function WatchlistControl({ anime }) {
  const [entry, setEntry] = useState(() => watchlist.get(anime.mal_id));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setEntry(watchlist.get(anime.mal_id));
  }, [anime.mal_id]);

  const add = (status) => {
    watchlist.upsert(anime, status);
    setEntry(watchlist.get(anime.mal_id));
    setOpen(false);
    toast.success(`Saved to "${STATUS_LABELS[status]}"`);
  };

  const remove = () => {
    watchlist.remove(anime.mal_id);
    setEntry(null);
    setOpen(false);
    toast('Removed from your watchlist');
  };

  return (
    <div className="relative w-full sm:w-auto">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
          entry
            ? 'bg-green-500/15 text-green-400 border border-green-500/40'
            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
        }`}
      >
        {entry ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {entry ? STATUS_LABELS[entry.status] : 'Add to Watchlist'}
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 sm:right-auto mt-2 sm:w-52 bg-[#1a2332] border border-white/10 rounded-xl shadow-xl py-1 z-50">
            {STATUS_ORDER.map((status) => (
              <button
                key={status}
                onClick={() => add(status)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 ${
                  entry?.status === status ? 'text-cyan-400' : 'text-gray-200'
                }`}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
            {entry && (
              <>
                <div className="border-t border-white/5 my-1" />
                <button onClick={remove} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5">
                  Remove from list
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EpisodesTab({ anime, episodes, loadingEps, hasMore, onLoadMore }) {
  const navigate = useNavigate();

  if (loadingEps && episodes.length === 0) {
    return <div className="py-10 text-center text-gray-500 text-sm">Loading episodes...</div>;
  }

  if (episodes.length === 0) {
    // Fall back to a numeric list when MAL has no detailed episode data yet
    const count = anime.episodes || 0;
    if (count > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => navigate(`/anime/${anime.mal_id}/${anime.slug}/episode/${i + 1}`)}
              className="flex items-center justify-between p-3 bg-[#1a2332] hover:bg-[#222d42] border border-white/5 rounded-lg text-left transition-colors group"
            >
              <span className="text-sm text-white">Episode {i + 1}</span>
              <span className="flex items-center gap-1 text-xs text-cyan-400 opacity-0 group-hover:opacity-100">
                <MessageSquare className="w-3 h-3" /> Discuss
              </span>
            </button>
          ))}
        </div>
      );
    }
    return <div className="py-10 text-center text-gray-500 text-sm">No episode list available yet.</div>;
  }

  return (
    <div>
      <div className="space-y-2">
        {episodes.map((ep) => (
          <button
            key={ep.mal_id}
            onClick={() => navigate(`/anime/${anime.mal_id}/${anime.slug}/episode/${ep.number}`)}
            className="w-full flex items-center gap-4 p-3 bg-[#1a2332] hover:bg-[#222d42] border border-white/5 rounded-lg text-left transition-colors group"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold">
              {ep.number}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{ep.title || `Episode ${ep.number}`}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                {ep.aired && <span>{new Date(ep.aired).toLocaleDateString()}</span>}
                {ep.filler && <span className="text-orange-400">Filler</span>}
                {ep.recap && <span className="text-purple-400">Recap</span>}
                {ep.score && (
                  <span className="flex items-center gap-0.5 text-yellow-400">
                    <Star className="w-3 h-3 fill-current" /> {ep.score}
                  </span>
                )}
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <MessageSquare className="w-3 h-3" /> Discuss
            </span>
          </button>
        ))}
      </div>
      {hasMore && (
        <div className="text-center mt-4">
          <button
            onClick={onLoadMore}
            disabled={loadingEps}
            className="px-5 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white"
          >
            {loadingEps ? 'Loading...' : 'Load more episodes'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AnimeDetailPage({ user, setUser }) {
  const { malId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('overview');

  const [episodes, setEpisodes] = useState([]);
  const [epPage, setEpPage] = useState(1);
  const [epHasMore, setEpHasMore] = useState(false);
  const [loadingEps, setLoadingEps] = useState(false);

  const anime = data?.anime;

  useSeo(
    anime
      ? {
          title: `${anime.title} — Episodes, Discussion & Where to Watch`,
          description: (anime.synopsis || `Track ${anime.title}, follow its episodes, and join the discussion with fellow anime fans on OtakuCafe.`).slice(0, 300),
          path: `/anime/${anime.mal_id}/${anime.slug}`,
          image: anime.image_url,
          type: 'video.tv_show',
          keywords: `${anime.title}, ${anime.title} discussion, ${anime.title} episodes, ${(anime.genres || []).join(', ')}, watch ${anime.title}`,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'TVSeries',
            name: anime.title,
            description: anime.synopsis,
            image: anime.image_url,
            genre: anime.genres,
            numberOfEpisodes: anime.episodes,
            datePublished: anime.aired_from,
            aggregateRating: anime.score
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: anime.score,
                  bestRating: 10,
                  ratingCount: anime.scored_by || 1,
                }
              : undefined,
            url: `${BASE_URL}/anime/${anime.mal_id}/${anime.slug}`,
          },
        }
      : { title: 'Anime', description: 'Anime details and discussion on OtakuCafe.' }
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    setTab('overview');
    setEpisodes([]);
    setEpPage(1);
    try {
      const result = await catalogApi.anime(malId);
      setData(result);
      window.scrollTo(0, 0);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [malId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadEpisodes = useCallback(async (page) => {
    setLoadingEps(true);
    try {
      const res = await catalogApi.episodes(malId, page);
      setEpisodes((prev) => (page === 1 ? res.episodes : [...prev, ...res.episodes]));
      setEpHasMore(res.has_next_page);
      setEpPage(page);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEps(false);
    }
  }, [malId]);

  useEffect(() => {
    if (tab === 'episodes' && episodes.length === 0) {
      loadEpisodes(1);
    }
  }, [tab, episodes.length, loadEpisodes]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <div className="animate-pulse flex flex-col md:flex-row gap-6">
          <div className="w-48 h-72 bg-[#1a2332] rounded-xl flex-shrink-0 mx-auto md:mx-0" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-[#1a2332] rounded w-2/3" />
            <div className="h-4 bg-[#1a2332] rounded w-1/3" />
            <div className="h-24 bg-[#1a2332] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-gray-400 mb-4">We couldn't load this anime right now.</p>
        <button onClick={() => navigate('/discover')} className="text-cyan-400 hover:underline">
          Back to Discover
        </button>
      </div>
    );
  }

  const stats = [
    anime.score && { icon: Star, label: 'Score', value: anime.score, accent: 'text-yellow-400' },
    anime.episodes && { icon: Film, label: 'Episodes', value: anime.episodes, accent: 'text-cyan-400' },
    anime.year && { icon: Calendar, label: 'Year', value: anime.year, accent: 'text-purple-400' },
    anime.members && { icon: UsersIcon, label: 'Members', value: anime.members.toLocaleString(), accent: 'text-blue-400' },
  ].filter(Boolean);

  return (
    <div>
      {/* Banner */}
      <div className="relative">
        <div className="absolute inset-0 h-64 overflow-hidden">
          {anime.image_url && (
            <img src={anime.image_url} alt="" className="w-full h-full object-cover blur-2xl scale-110 opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a]/60 via-[#0a0e1a]/80 to-[#0a0e1a]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 pt-6 relative">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Poster */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className="w-44 sm:w-52 rounded-xl overflow-hidden shadow-2xl border border-white/10">
                {anime.image_url ? (
                  <img src={anime.image_url} alt={anime.title} className="w-full aspect-[2/3] object-cover" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-[#1a2332] flex items-center justify-center text-4xl">🎬</div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1">{anime.title}</h1>
              {anime.title_original && anime.title_original !== anime.title && (
                <p className="text-sm text-gray-400 mb-3">{anime.title_original}</p>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-4">
                {anime.type && (
                  <span className="flex items-center gap-1 text-xs bg-white/5 text-gray-300 px-2 py-1 rounded-md">
                    <Tv className="w-3 h-3" /> {anime.type}
                  </span>
                )}
                {anime.status && (
                  <span className="text-xs bg-white/5 text-gray-300 px-2 py-1 rounded-md">{anime.status}</span>
                )}
                {anime.duration && (
                  <span className="flex items-center gap-1 text-xs bg-white/5 text-gray-300 px-2 py-1 rounded-md">
                    <Clock className="w-3 h-3" /> {anime.duration}
                  </span>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mb-5">
                {(anime.genres || []).map((g) => (
                  <span key={g} className="text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                    {g}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 mb-6">
                <WatchlistControl anime={anime} />
                {anime.trailer_url && (
                  <a
                    href={anime.trailer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors w-full sm:w-auto"
                  >
                    <Play className="w-4 h-4" /> Watch Trailer
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
                {stats.map((s) => (
                  <div key={s.label} className="bg-white/5 rounded-lg p-3 text-center">
                    <s.icon className={`w-4 h-4 ${s.accent} mx-auto mb-1`} />
                    <p className="text-sm font-bold text-white">{s.value}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-8 border-b border-white/10">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'episodes', label: 'Episodes' },
              { id: 'discussion', label: 'Discussion' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  tab === t.id
                    ? 'text-cyan-400 border-cyan-400'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {tab === 'overview' && (
          <div className="max-w-3xl">
            <h2 className="text-lg font-bold text-white mb-3">Synopsis</h2>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line mb-6">
              {anime.synopsis || 'No synopsis available.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {anime.studios?.length > 0 && (
                <Detail label="Studios" value={anime.studios.join(', ')} />
              )}
              {anime.aired_string && <Detail label="Aired" value={anime.aired_string} />}
              {anime.source && <Detail label="Source" value={anime.source} />}
              {anime.rating && <Detail label="Rating" value={anime.rating} />}
              {anime.themes?.length > 0 && <Detail label="Themes" value={anime.themes.join(', ')} />}
              {anime.broadcast && <Detail label="Broadcast" value={anime.broadcast} />}
            </div>

            <div className="mt-8 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Talk about {anime.title}</p>
                <p className="text-xs text-gray-400">Join the discussion or react episode-by-episode.</p>
              </div>
              <button
                onClick={() => setTab('discussion')}
                className="flex-shrink-0 flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
              >
                <MessageSquare className="w-4 h-4" /> Discuss
              </button>
            </div>
          </div>
        )}

        {tab === 'episodes' && (
          <div className="max-w-3xl">
            <EpisodesTab
              anime={anime}
              episodes={episodes}
              loadingEps={loadingEps}
              hasMore={epHasMore}
              onLoadMore={() => loadEpisodes(epPage + 1)}
            />
          </div>
        )}

        {tab === 'discussion' && (
          <div className="max-w-3xl">
            <DiscussionThread
              animeId={String(anime.mal_id)}
              animeTitle={anime.title}
              user={user}
              setUser={setUser}
            />
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations?.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-white mb-4">You might also like</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
              {data.recommendations.slice(0, 12).map((rec) => (
                <AnimeCard key={rec.mal_id} anime={rec} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex gap-2 py-1 border-b border-white/5">
      <span className="text-gray-500 min-w-[80px]">{label}</span>
      <span className="text-gray-200">{value}</span>
    </div>
  );
}
