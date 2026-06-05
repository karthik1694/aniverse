import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, Clock, TrendingUp, ArrowUp, MessageSquare, Plus, X, Send, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { communityApi, CATEGORY_COLORS } from '../api/community';
import { createAnonymousSession } from '../utils/anonymousAuth';
import useSeo from '../hooks/useSeo';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

const SORTS = [
  { key: 'hot', label: 'Hot', icon: Flame },
  { key: 'new', label: 'New', icon: Clock },
  { key: 'top', label: 'Top', icon: TrendingUp },
];

function CategoryBadge({ category }) {
  const cls = CATEGORY_COLORS[category] || 'text-gray-300 bg-white/5 border-white/10';
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{category}</span>;
}

function PostCard({ post, user, ensureUser, onVoted }) {
  const navigate = useNavigate();
  const [count, setCount] = useState(post.upvote_count || 0);
  const [voted, setVoted] = useState((post.upvotes || []).includes(user?.id));

  const vote = async (e) => {
    e.stopPropagation();
    const u = ensureUser();
    const optimisticVoted = !voted;
    setVoted(optimisticVoted);
    setCount((c) => c + (optimisticVoted ? 1 : -1));
    try {
      const res = await communityApi.votePost(post.id, u);
      setCount(res.count);
      setVoted(res.voted);
      onVoted?.(post.id, res.count);
    } catch {
      setVoted(!optimisticVoted);
      setCount((c) => c + (optimisticVoted ? -1 : 1));
    }
  };

  return (
    <div
      onClick={() => navigate(`/community/${post.id}`)}
      className="flex gap-3 p-4 bg-[#1a2332] border border-white/5 rounded-xl hover:border-cyan-500/30 transition-colors cursor-pointer"
    >
      {/* Vote column */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <button
          onClick={vote}
          className={`p-1.5 rounded-md transition-colors ${
            voted ? 'text-cyan-400 bg-cyan-500/15' : 'text-gray-500 hover:text-cyan-400 hover:bg-white/5'
          }`}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <span className={`text-sm font-bold tabular-nums ${voted ? 'text-cyan-400' : 'text-gray-300'}`}>{count}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <CategoryBadge category={post.category} />
          <span className="text-xs text-gray-500">
            {post.user_name} · {timeAgo(post.created_at)}
          </span>
        </div>
        <h3 className="text-base font-semibold text-white leading-snug mb-1 line-clamp-2">{post.title}</h3>
        {post.body && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-2">{post.body}</p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <MessageSquare className="w-3.5 h-3.5" />
          {post.comment_count || 0} comments
        </div>
      </div>
    </div>
  );
}

function CreatePostModal({ open, onClose, categories, user, ensureUser, onCreated }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Discussion');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const u = ensureUser();
      const post = await communityApi.createPost({ title: title.trim(), body: body.trim(), category, user: u });
      toast.success('Post created!');
      setTitle('');
      setBody('');
      onCreated?.(post);
      onClose();
    } catch (err) {
      toast.error('Could not create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-16 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-[#151b28] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Create a post</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCategory(c)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  category === c
                    ? (CATEGORY_COLORS[c] || 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30')
                    : 'text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="An interesting title"
            maxLength={300}
            className="w-full bg-[#1a2332] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts, theories, recommendations... (optional)"
            rows={5}
            maxLength={10000}
            className="w-full bg-[#1a2332] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-300 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg"
            >
              <Send className="w-3.5 h-3.5" /> {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CommunityPage({ user, setUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('hot');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  useSeo({
    title: 'Community — Anime Discussions, Theories & Recommendations',
    description:
      'Join the OtakuCafe community. Post discussions, theories, recommendations and news, upvote the best takes, and talk anime with fans worldwide. Free, no signup needed.',
    path: '/community',
    keywords: 'anime community, anime discussion forum, anime recommendations, anime theories, anime reddit, otaku forum',
  });

  const ensureUser = useCallback(() => {
    if (user) return user;
    const { user: anon } = createAnonymousSession();
    if (setUser) setUser(anon);
    return anon;
  }, [user, setUser]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPosts(await communityApi.listPosts(sort, category));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [sort, category]);

  useEffect(() => {
    communityApi.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Community</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">Discuss, theorize, and share recommendations with fellow otaku.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex-shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-cyan-500/30"
        >
          <Plus className="w-4 h-4" /> Create Post
        </button>
      </div>

      {/* Sort + category filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex gap-1 bg-[#1a2332] border border-white/5 rounded-lg p-1">
          {SORTS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                sort === key ? 'bg-cyan-500/15 text-cyan-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              category === c
                ? 'bg-cyan-500 text-white border-cyan-500'
                : 'text-gray-300 border-white/10 hover:bg-white/5'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-[#1a2332] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-white mb-1">No posts yet</h2>
          <p className="text-sm text-gray-400 mb-5">Be the first to start a conversation in the community.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg"
          >
            Create the first post
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} user={user} ensureUser={ensureUser} />
          ))}
        </div>
      )}

      <CreatePostModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        categories={categories.length ? categories : ['Discussion']}
        user={user}
        ensureUser={ensureUser}
        onCreated={() => load()}
      />
    </div>
  );
}
