import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { catalogApi } from '../api/catalog';
import { watchlist } from '../utils/watchlist';
import DiscussionThread from '../components/DiscussionThread';
import useSeo, { BASE_URL } from '../hooks/useSeo';

export default function EpisodeDiscussionPage({ user, setUser }) {
  const { malId, slug, epNum } = useParams();
  const navigate = useNavigate();
  const episodeNumber = parseInt(epNum, 10);

  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);

  useSeo(
    anime
      ? {
          title: `${anime.title} Episode ${episodeNumber} Discussion & Reactions`,
          description: `Discuss ${anime.title} Episode ${episodeNumber} with fellow fans. Share reactions, theories, and spoiler-safe thoughts on OtakuCafe.`,
          path: `/anime/${malId}/${slug}/episode/${episodeNumber}`,
          image: anime.image_url,
          type: 'article',
          keywords: `${anime.title} episode ${episodeNumber}, ${anime.title} ep ${episodeNumber} discussion, ${anime.title} ${episodeNumber} reaction`,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'DiscussionForumPosting',
            headline: `${anime.title} Episode ${episodeNumber} Discussion`,
            about: anime.title,
            url: `${BASE_URL}/anime/${malId}/${slug}/episode/${episodeNumber}`,
            image: anime.image_url,
          },
        }
      : { title: `Episode ${episodeNumber} Discussion`, description: 'Anime episode discussion on OtakuCafe.' }
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await catalogApi.anime(malId);
      setAnime(result.anime);
      window.scrollTo(0, 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [malId]);

  useEffect(() => {
    load();
  }, [load, episodeNumber]);

  const markWatched = () => {
    if (!anime) return;
    if (!watchlist.isInList(anime.mal_id)) {
      watchlist.upsert(anime, 'watching');
    }
    watchlist.setProgress(anime.mal_id, episodeNumber);
    toast.success(`Marked ${anime.title} up to Episode ${episodeNumber} as watched`);
  };

  const totalEps = anime?.episodes || null;
  const hasPrev = episodeNumber > 1;
  const hasNext = !totalEps || episodeNumber < totalEps;

  const goToEp = (n) => navigate(`/anime/${malId}/${slug}/episode/${n}`);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[#1a2332] rounded w-1/2" />
          <div className="h-32 bg-[#1a2332] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-5 flex-wrap">
        <Link to="/discover" className="hover:text-cyan-400">Discover</Link>
        <span>/</span>
        {anime && (
          <>
            <Link to={`/anime/${malId}/${slug}`} className="hover:text-cyan-400 truncate max-w-[200px]">
              {anime.title}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-300">Episode {episodeNumber}</span>
      </nav>

      <div className="grid lg:grid-cols-[280px,1fr] gap-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          {anime && (
            <div className="bg-[#1a2332] border border-white/5 rounded-xl overflow-hidden">
              {anime.image_url && (
                <img src={anime.image_url} alt={anime.title} className="w-full aspect-[2/3] object-cover" />
              )}
              <div className="p-4">
                <Link to={`/anime/${malId}/${slug}`} className="text-sm font-bold text-white hover:text-cyan-400 line-clamp-2">
                  {anime.title}
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                  Episode {episodeNumber}{totalEps ? ` of ${totalEps}` : ''}
                </p>
                <button
                  onClick={markWatched}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" /> Mark as watched
                </button>
              </div>
            </div>
          )}

          {/* Episode navigation */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => hasPrev && goToEp(episodeNumber - 1)}
              disabled={!hasPrev}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-sm bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 rounded-lg text-white"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => hasNext && goToEp(episodeNumber + 1)}
              disabled={!hasNext}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-sm bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 rounded-lg text-white"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
            {anime ? anime.title : 'Anime'} — Episode {episodeNumber} Discussion
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            Share your reactions and theories about episode {episodeNumber}. Use the spoiler toggle
            to keep things friendly for fans who haven't caught up yet.
          </p>

          <div className="bg-[#11151f] border border-white/5 rounded-2xl p-5 sm:p-6">
            <DiscussionThread
              animeId={String(malId)}
              animeTitle={anime?.title}
              episodeNumber={episodeNumber}
              user={user}
              setUser={setUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
