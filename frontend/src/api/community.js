import { axiosInstance } from './axiosInstance';

/**
 * Community (Reddit-style) API: posts, comments, and votes.
 * Posting/voting works for anonymous users via the user_data fallback.
 */
export const communityApi = {
  categories: async () => {
    const { data } = await axiosInstance.get('community/categories');
    return data.categories || [];
  },

  listPosts: async (sort = 'hot', category = null, limit = 50) => {
    const params = { sort, limit };
    if (category && category !== 'All') params.category = category;
    const { data } = await axiosInstance.get('community/posts', { params });
    return data.posts || [];
  },

  createPost: async ({ title, body, category, user }) => {
    const { data } = await axiosInstance.post('community/posts', {
      title,
      body,
      category,
      user_data: user,
    });
    return data;
  },

  getPost: async (postId) => {
    const { data } = await axiosInstance.get(`community/posts/${postId}`);
    return data;
  },

  votePost: async (postId, user) => {
    const { data } = await axiosInstance.post(`community/posts/${postId}/vote`, { user_data: user });
    return data;
  },

  addComment: async (postId, message, user) => {
    const { data } = await axiosInstance.post(`community/posts/${postId}/comments`, {
      message,
      user_data: user,
    });
    return data;
  },

  voteComment: async (commentId, user) => {
    const { data } = await axiosInstance.post(`community/comments/${commentId}/vote`, { user_data: user });
    return data;
  },
};

export const CATEGORY_COLORS = {
  Discussion: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
  Recommendation: 'text-green-300 bg-green-500/10 border-green-500/20',
  News: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
  Question: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20',
  Theory: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
  'Fan Art': 'text-pink-300 bg-pink-500/10 border-pink-500/20',
  Meme: 'text-orange-300 bg-orange-500/10 border-orange-500/20',
  Review: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20',
};
