import { axiosInstance } from './axiosInstance';

/**
 * Anime catalog + discussion API.
 * All catalog data is sourced from the free Jikan (MyAnimeList) API via our backend,
 * which caches responses so pages stay fast and we never hit rate limits.
 */

export const catalogApi = {
  seasonal: async (limit = 24) => {
    const { data } = await axiosInstance.get('catalog/seasonal', { params: { limit } });
    return data.results || [];
  },

  top: async (limit = 24, filter = null) => {
    const params = { limit };
    if (filter) params.filter = filter;
    const { data } = await axiosInstance.get('catalog/top', { params });
    return data.results || [];
  },

  search: async (q, limit = 24) => {
    if (!q) return [];
    const { data } = await axiosInstance.get('catalog/search', { params: { q, limit } });
    return data.results || [];
  },

  schedule: async () => {
    const { data } = await axiosInstance.get('catalog/schedule');
    return data.schedule || {};
  },

  anime: async (malId) => {
    const { data } = await axiosInstance.get(`catalog/anime/${malId}`);
    return data;
  },

  episodes: async (malId, page = 1) => {
    const { data } = await axiosInstance.get(`catalog/anime/${malId}/episodes`, { params: { page } });
    return data;
  },
};

// Track which anime have already been prefetched so repeated hovers don't
// refire requests.
const _prefetched = new Set();

/**
 * Warm the cache for an anime's detail page (fire-and-forget).
 * Called on card hover so the backend (memory + Redis) cache is hot before the
 * user clicks — turning a ~3s "first view" into an instant load. Failures are
 * swallowed and allow a later retry.
 */
export function prefetchAnime(malId) {
  if (!malId || _prefetched.has(malId)) return;
  _prefetched.add(malId);
  axiosInstance.get(`catalog/anime/${malId}`).catch(() => {
    _prefetched.delete(malId);
  });
}

export const discussionApi = {
  list: async (animeId, episodeNumber = null) => {
    const params = {};
    if (episodeNumber !== null && episodeNumber !== undefined) params.episode_number = episodeNumber;
    const { data } = await axiosInstance.get(`discussions/${animeId}`, { params });
    return data.comments || [];
  },

  post: async (animeId, payload) => {
    const { data } = await axiosInstance.post(`discussions/${animeId}`, payload);
    return data;
  },

  like: async (animeId, commentId, userId) => {
    const { data } = await axiosInstance.post(`discussions/${animeId}/like/${commentId}`, { user_id: userId });
    return data;
  },

  stats: async (animeId) => {
    const { data } = await axiosInstance.get(`discussions/${animeId}/stats`);
    return data;
  },
};
