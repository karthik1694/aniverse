import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TrendingUp, Flame, Sparkles, Trophy, ArrowRight, Search as SearchIcon } from 'lucide-react';
import { catalogApi } from '../api/catalog';
import AnimeCard from '../components/AnimeCard';
import useSeo from '../hooks/useSeo';

function SkeletonGrid({ count = 12 }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-xl bg-[#1a2332]" />
          <div className="h-3 bg-[#1a2332] rounded mt-2 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function Section({ title, icon: Icon, accent, children, action }) {
  return (
    <section className="mb-10 sm:mb-14">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${accent}`} />
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function AnimeGrid({ items, withRank }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
      {items.map((anime, i) => (
        <AnimeCard key={anime.mal_id} anime={anime} rank={withRank ? i + 1 : undefined} />
      ))}
    </div>
  );
}

export default function DiscoverPage({ user }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const [seasonal, setSeasonal] = useState([]);
  const [topAiring, setTopAiring] = useState([]);
  const [topAll, setTopAll] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useSeo(
    query
      ? {
          title: `Search results for "${query}"`,
          description: `Browse anime matching "${query}" on OtakuCafe. Track what you watch and join episode discussions.`,
          path: `/discover?q=${encodeURIComponent(query)}`,
        }
      : {
          title: 'Track Anime, Discuss Episodes & Follow the Airing Schedule',
          description:
            'Discover anime airing this season, trending series, and the all-time top rated shows. Track your progress and join episode discussions with fellow otaku — free, no signup needed.',
          path: '/',
          keywords:
            'anime this season, seasonal anime, trending anime, top anime, anime tracker, anime episode discussion, what to watch anime',
        }
  );

  const loadHome = useCallback(async () => {
    setLoading(true);
    try {
      const [s, ta, tall] = await Promise.all([
        catalogApi.seasonal(18),
        catalogApi.top(12, 'airing'),
        catalogApi.top(18, 'bypopularity'),
      ]);
      setSeasonal(s);
      setTopAiring(ta);
      setTopAll(tall);
    } catch (e) {
      console.error('Failed to load discover', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const runSearch = useCallback(async (q) => {
    setSearching(true);
    try {
      setSearchResults(await catalogApi.search(q, 30));
    } catch (e) {
      console.error('Search failed', e);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (query) {
      runSearch(query);
    } else {
      loadHome();
    }
  }, [query, runSearch, loadHome]);

  // ---- Search results view ----
  if (query) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <SearchIcon className="w-5 h-5 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">
            Results for "<span className="text-cyan-400">{query}</span>"
          </h1>
        </div>
        {searching ? (
          <SkeletonGrid count={18} />
        ) : searchResults.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No anime found for "{query}".</p>
            <button onClick={() => navigate('/discover')} className="text-cyan-400 hover:underline">
              Browse trending anime instead
            </button>
          </div>
        ) : (
          <AnimeGrid items={searchResults} />
        )}
      </div>
    );
  }

  // ---- Home / discover view ----
  return (
    <div>
      {/* Hero */}
      {(!user || user.isAnonymous) && (
        <div className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-600/5 to-purple-600/10" />
          <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-cyan-400 font-medium">Your anime, tracked & discussed</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4">
                Track every anime.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
                  Discuss every episode.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-gray-300 mb-6 max-w-2xl leading-relaxed">
                Keep a personal watchlist, follow the weekly airing schedule, and jump into episode
                discussions with otaku worldwide. Free, no signup required.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/schedule')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg shadow-cyan-500/30 transition-all"
                >
                  See what's airing now
                </button>
                <button
                  onClick={() => navigate('/watchlist')}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-6 py-3 rounded-lg transition-all"
                >
                  Start my watchlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {loading ? (
          <>
            <Section title="Airing This Season" icon={Sparkles} accent="text-cyan-400">
              <SkeletonGrid count={18} />
            </Section>
          </>
        ) : (
          <>
            <Section
              title="Airing This Season"
              icon={Sparkles}
              accent="text-cyan-400"
              action={
                <button
                  onClick={() => navigate('/schedule')}
                  className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Schedule <ArrowRight className="w-4 h-4" />
                </button>
              }
            >
              <AnimeGrid items={seasonal} />
            </Section>

            <Section title="Top Airing Right Now" icon={Flame} accent="text-orange-400">
              <AnimeGrid items={topAiring} withRank />
            </Section>

            <Section title="Most Popular of All Time" icon={Trophy} accent="text-yellow-400">
              <AnimeGrid items={topAll} withRank />
            </Section>
          </>
        )}

        {/* SEO copy block */}
        <div className="mt-8 max-w-3xl">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" /> Your anime hub
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            OtakuCafe helps you keep track of every series you're watching, discover what's airing
            this season, and talk about each new episode the moment it drops. Browse trending and
            top-rated anime, build your personal watchlist, and join spoiler-safe episode
            discussions with a global community of fans — all completely free.
          </p>
        </div>
      </div>
    </div>
  );
}
