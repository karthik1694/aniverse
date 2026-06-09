import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Play, Plus, Check } from 'lucide-react';
import { watchlist } from '../utils/watchlist';
import { prefetchAnime } from '../api/catalog';
import { toast } from 'sonner';

/**
 * Reusable anime poster card with hover details + quick "add to list" action.
 */
export default function AnimeCard({ anime, rank, onAdded }) {
  const navigate = useNavigate();
  const [inList, setInList] = React.useState(() => watchlist.isInList(anime.mal_id));
  const prefetchTimer = React.useRef(null);

  const goToDetail = (e) => {
    // Prevent the click from also bubbling to the parent card's onClick, which
    // would call navigate() twice and push two history entries (making the back
    // button need two presses).
    e?.stopPropagation?.();
    navigate(`/anime/${anime.mal_id}/${anime.slug || ''}`);
  };

  // Hover-intent prefetch: only warm the detail cache if the user lingers on a
  // card for a moment, so sweeping the mouse across the grid doesn't spam the API.
  const startPrefetch = () => {
    if (prefetchTimer.current) return;
    prefetchTimer.current = setTimeout(() => {
      prefetchAnime(anime.mal_id);
    }, 150);
  };

  const cancelPrefetch = () => {
    if (prefetchTimer.current) {
      clearTimeout(prefetchTimer.current);
      prefetchTimer.current = null;
    }
  };

  React.useEffect(() => () => cancelPrefetch(), []);

  const quickAdd = (e) => {
    e.stopPropagation();
    if (inList) {
      navigate('/watchlist');
      return;
    }
    watchlist.upsert(anime);
    setInList(true);
    toast.success(`Added "${anime.title}" to your watchlist`);
    onAdded?.(anime);
  };

  return (
    <div
      onClick={goToDetail}
      onMouseEnter={startPrefetch}
      onMouseLeave={cancelPrefetch}
      onFocus={startPrefetch}
      onBlur={cancelPrefetch}
      className="group cursor-pointer flex flex-col"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && goToDetail()}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#1a2332] border border-white/5 group-hover:border-cyan-500/40 transition-all duration-300 shadow-lg group-hover:shadow-cyan-500/20">
        {anime.image_url ? (
          <img
            src={anime.image_url}
            alt={anime.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">🎬</div>
        )}

        {/* Rank badge */}
        {rank && (
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md border border-white/10">
            #{rank}
          </div>
        )}

        {/* Score badge */}
        {anime.score && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold px-2 py-1 rounded-md border border-white/10">
            <Star className="w-3 h-3 fill-current" />
            {anime.score}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={goToDetail}
              className="flex-1 flex items-center justify-center gap-1 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              <Play className="w-3 h-3" /> Details
            </button>
            <button
              onClick={quickAdd}
              title={inList ? 'In your watchlist' : 'Add to watchlist'}
              className={`p-2 rounded-lg transition-colors ${
                inList
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
              }`}
            >
              {inList ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Meta below poster */}
      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-cyan-400 transition-colors">
          {anime.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
          {anime.type && <span>{anime.type}</span>}
          {anime.episodes && <span>• {anime.episodes} eps</span>}
          {anime.year && <span>• {anime.year}</span>}
        </div>
      </div>
    </div>
  );
}
