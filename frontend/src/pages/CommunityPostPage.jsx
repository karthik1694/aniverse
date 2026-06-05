import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowUp, ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { communityApi, CATEGORY_COLORS } from '../api/community';
import { createAnonymousSession } from '../utils/anonymousAuth';
import useSeo, { BASE_URL } from '../hooks/useSeo';

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

function Avatar({ name, picture }) {
  if (picture) return <img src={picture} alt={name} className="w-8 h-8 rounded-full object-cover" />;
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
      {(name || 'A').charAt(0).toUpperCase()}
    </div>
  );
}

function CommentRow({ comment, user, ensureUser }) {
  const [count, setCount] = useState(comment.upvote_count || 0);
  const [voted, setVoted] = useState((comment.upvotes || []).includes(user?.id));

  const vote = async () => {
    const u = ensureUser();
    const next = !voted;
    setVoted(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      const res = await communityApi.voteComment(comment.id, u);
      setCount(res.count);
      setVoted(res.voted);
    } catch {
      setVoted(!next);
      setCount((c) => c + (next ? -1 : 1));
    }
  };

  return (
    <div className="flex gap-3 py-4 border-b border-white/5 last:border-0">
      <Avatar name={comment.user_name} picture={comment.user_picture} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white">{comment.user_name}</span>
          <span className="text-xs text-gray-500">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed">{comment.message}</p>
        <button
          onClick={vote}
          className={`mt-2 flex items-center gap-1 text-xs transition-colors ${
            voted ? 'text-cyan-400' : 'text-gray-500 hover:text-cyan-400'
          }`}
        >
          <ArrowUp className="w-3.5 h-3.5" /> {count > 0 && count}
        </button>
      </div>
    </div>
  );
}

export default function CommunityPostPage({ user, setUser }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);

  const [voteCount, setVoteCount] = useState(0);
  const [voted, setVoted] = useState(false);

  useSeo(
    post
      ? {
          title: `${post.title} — Community`,
          description: (post.body || `Join the discussion: ${post.title}`).slice(0, 200),
          path: `/community/${postId}`,
          type: 'article',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'DiscussionForumPosting',
            headline: post.title,
            articleBody: post.body,
            datePublished: post.created_at,
            author: { '@type': 'Person', name: post.user_name },
            url: `${BASE_URL}/community/${postId}`,
            interactionStatistic: [
              { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: post.upvote_count || 0 },
              { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: comments.length },
            ],
          },
        }
      : { title: 'Community Post', description: 'Anime community discussion on OtakuCafe.' }
  );

  const ensureUser = useCallback(() => {
    if (user) return user;
    const { user: anon } = createAnonymousSession();
    if (setUser) setUser(anon);
    return anon;
  }, [user, setUser]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await communityApi.getPost(postId);
      setPost(data.post);
      setComments(data.comments || []);
      setVoteCount(data.post.upvote_count || 0);
      setVoted((data.post.upvotes || []).includes(user?.id));
      window.scrollTo(0, 0);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [postId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const votePost = async () => {
    const u = ensureUser();
    const next = !voted;
    setVoted(next);
    setVoteCount((c) => c + (next ? 1 : -1));
    try {
      const res = await communityApi.votePost(postId, u);
      setVoteCount(res.count);
      setVoted(res.voted);
    } catch {
      setVoted(!next);
      setVoteCount((c) => c + (next ? -1 : 1));
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setPosting(true);
    try {
      const u = ensureUser();
      const newComment = await communityApi.addComment(postId, text, u);
      setComments((prev) => [...prev, newComment]);
      setMessage('');
    } catch {
      toast.error('Could not post your comment. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[#1a2332] rounded w-2/3" />
          <div className="h-24 bg-[#1a2332] rounded" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-gray-400 mb-4">This post couldn't be found.</p>
        <Link to="/community" className="text-cyan-400 hover:underline">Back to Community</Link>
      </div>
    );
  }

  const catCls = CATEGORY_COLORS[post.category] || 'text-gray-300 bg-white/5 border-white/10';

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-3xl">
      <button onClick={() => navigate('/community')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Community
      </button>

      {/* Post */}
      <div className="flex gap-4 p-5 bg-[#1a2332] border border-white/5 rounded-2xl">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <button
            onClick={votePost}
            className={`p-2 rounded-md transition-colors ${
              voted ? 'text-cyan-400 bg-cyan-500/15' : 'text-gray-500 hover:text-cyan-400 hover:bg-white/5'
            }`}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <span className={`text-base font-bold tabular-nums ${voted ? 'text-cyan-400' : 'text-gray-300'}`}>{voteCount}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catCls}`}>{post.category}</span>
            <span className="text-xs text-gray-500">{post.user_name} · {timeAgo(post.created_at)}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-3">{post.title}</h1>
          {post.body && (
            <p className="text-sm sm:text-base text-gray-200 whitespace-pre-wrap break-words leading-relaxed">{post.body}</p>
          )}
        </div>
      </div>

      {/* Comment composer */}
      <form onSubmit={submitComment} className="mt-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-3">
          <MessageSquare className="w-5 h-5 text-cyan-400" /> Comments
          <span className="text-sm text-gray-500 font-normal">({comments.length})</span>
        </h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          maxLength={5000}
          className="w-full bg-[#1a2332] border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!message.trim() || posting}
            className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            <Send className="w-3.5 h-3.5" /> {posting ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </form>

      {/* Comments */}
      <div className="mt-4 bg-[#11151f] border border-white/5 rounded-2xl px-5">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-10">No comments yet. Start the conversation!</p>
        ) : (
          <div className="divide-y divide-white/5">
            {comments.map((c) => (
              <CommentRow key={c.id} comment={c} user={user} ensureUser={ensureUser} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
