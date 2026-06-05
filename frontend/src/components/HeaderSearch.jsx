import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Star } from 'lucide-react';
import { catalogApi } from '../api/catalog';

/**
 * Live anime search with a debounced autocomplete dropdown.
 * Results appear as you type; clicking one opens its detail page,
 * and Enter (or "See all results") goes to the full results view.
 */
export default function HeaderSearch({ className = '', autoFocus = false, onNavigate }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const boxRef = useRef(null);
  const debounceRef = useRef(null);
  const seqRef = useRef(0);

  // Debounced live search
  useEffect(() => {
    const q = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);
    const seq = ++seqRef.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await catalogApi.search(q, 8);
        // Ignore out-of-order responses
        if (seq === seqRef.current) {
          setResults(res);
        }
      } catch {
        if (seq === seqRef.current) setResults([]);
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    }, 280);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goToAnime = useCallback(
    (a) => {
      navigate(`/anime/${a.mal_id}/${a.slug || ''}`);
      setOpen(false);
      setQuery('');
      setResults([]);
      onNavigate?.();
    },
    [navigate, onNavigate]
  );

  const goToAll = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    navigate(`/discover?q=${encodeURIComponent(q)}`);
    setOpen(false);
    onNavigate?.();
  }, [navigate, query, onNavigate]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) goToAnime(results[activeIndex]);
      else goToAll();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const q = query.trim();

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => q.length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search anime..."
          autoFocus={autoFocus}
          className="w-full bg-[#1a2332] border border-white/10 rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />
        )}
      </div>

      {open && q.length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#11151f] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60] max-h-[70vh] overflow-y-auto">
          {loading && results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No anime found for “{q}”
            </div>
          ) : (
            <>
              {results.map((a, i) => (
                <button
                  key={a.mal_id}
                  type="button"
                  onClick={() => goToAnime(a)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    i === activeIndex ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  {a.image_url ? (
                    <img
                      src={a.image_url}
                      alt=""
                      loading="lazy"
                      className="w-9 h-12 object-cover rounded flex-shrink-0 bg-[#1a2332]"
                    />
                  ) : (
                    <div className="w-9 h-12 rounded bg-[#1a2332] flex items-center justify-center text-xs flex-shrink-0">🎬</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{a.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {[a.type, a.year, a.episodes ? `${a.episodes} eps` : null].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                  {a.score ? (
                    <span className="flex items-center gap-0.5 text-xs text-yellow-400 flex-shrink-0">
                      <Star className="w-3 h-3 fill-current" />
                      {a.score}
                    </span>
                  ) : null}
                </button>
              ))}
              <button
                type="button"
                onClick={goToAll}
                className="w-full px-4 py-2.5 text-sm text-cyan-400 hover:bg-white/5 border-t border-white/5 text-left font-medium"
              >
                See all results for “{q}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
