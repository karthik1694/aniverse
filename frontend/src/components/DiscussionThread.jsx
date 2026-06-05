import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Send, Heart, EyeOff, Eye, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { discussionApi } from '../api/catalog';
import { createAnonymousSession } from '../utils/anonymousAuth';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function Comment({ comment, currentUserId, onLike }) {
  const [revealed, setRevealed] = useState(false);
  const initial = (comment.user_name || 'A').charAt(0).toUpperCase();
  const liked = (comment.likes || []).includes(currentUserId);
  const likeCount = (comment.likes || []).length;

  return (
    <div className="flex gap-3 py-4 border-b border-white/5 last:border-0">
      {comment.user_picture ? (
        <img src={comment.user_picture} alt={comment.user_name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {initial}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-white text-sm">{comment.user_name}</span>
          {comment.episode_number != null && (
            <span className="text-[10px] bg-cyan-500/15 text-cyan-300 px-1.5 py-0.5 rounded">Ep {comment.episode_number}</span>
          )}
          {comment.is_spoiler && (
            <span className="text-[10px] bg-red-500/15 text-red-300 px-1.5 py-0.5 rounded flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Spoiler
            </span>
          )}
          <span className="text-xs text-gray-500">{timeAgo(comment.created_at)}</span>
        </div>

        {comment.is_spoiler && !revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="text-sm text-gray-400 italic flex items-center gap-1.5 hover:text-gray-200"
          >
            <EyeOff className="w-3.5 h-3.5" /> Spoiler hidden — click to reveal
          </button>
        ) : (
          <p className="text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed">{comment.message}</p>
        )}

        <button
          onClick={() => onLike(comment)}
          className={`mt-2 flex items-center gap-1.5 text-xs transition-colors ${
            liked ? 'text-pink-400' : 'text-gray-500 hover:text-pink-400'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
          {likeCount > 0 && likeCount}
        </button>
      </div>
    </div>
  );
}

/**
 * Reusable discussion thread. Supports series-level (episodeNumber null)
 * or per-episode discussions. Anonymous users can post - we mint an
 * anonymous identity on the fly so there is zero friction.
 */
export default function DiscussionThread({ animeId, animeTitle, episodeNumber = null, user, setUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await discussionApi.list(animeId, episodeNumber);
      setComments(data);
    } catch (e) {
      console.error('Failed to load discussions', e);
    } finally {
      setLoading(false);
    }
  }, [animeId, episodeNumber]);

  useEffect(() => {
    load();
  }, [load]);

  const ensureUser = () => {
    if (user) return user;
    const { user: anonUser } = createAnonymousSession();
    if (setUser) setUser(anonUser);
    return anonUser;
  };

  const handlePost = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setPosting(true);
    try {
      const author = ensureUser();
      const newComment = await discussionApi.post(animeId, {
        message: text,
        episode_number: episodeNumber,
        anime_title: animeTitle,
        is_spoiler: isSpoiler,
        user_data: author,
      });
      setComments((prev) => [newComment, ...prev]);
      setMessage('');
      setIsSpoiler(false);
    } catch (err) {
      console.error(err);
      toast.error('Could not post your comment. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (comment) => {
    const author = ensureUser();
    // optimistic update
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== comment.id) return c;
        const likes = new Set(c.likes || []);
        likes.has(author.id) ? likes.delete(author.id) : likes.add(author.id);
        return { ...c, likes: [...likes] };
      })
    );
    try {
      await discussionApi.like(animeId, comment.id, author.id);
    } catch (e) {
      load(); // revert on failure
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-white">
          {episodeNumber != null ? `Episode ${episodeNumber} Discussion` : 'Discussion'}
        </h2>
        {comments.length > 0 && (
          <span className="text-sm text-gray-500">({comments.length})</span>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handlePost} className="mb-6">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            episodeNumber != null
              ? `Share your thoughts on episode ${episodeNumber}...`
              : `Start a discussion about ${animeTitle || 'this anime'}...`
          }
          rows={3}
          maxLength={2000}
          className="w-full bg-[#1a2332] border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 resize-none transition-all"
        />
        <div className="flex items-center justify-between mt-2">
          <button
            type="button"
            onClick={() => setIsSpoiler((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              isSpoiler
                ? 'border-red-500/40 text-red-300 bg-red-500/10'
                : 'border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {isSpoiler ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            Mark as spoiler
          </button>
          <button
            type="submit"
            disabled={!message.trim() || posting}
            className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
        {!user && (
          <p className="text-[11px] text-gray-500 mt-1.5">
            Posting will create a free anonymous otaku identity — no signup needed.
          </p>
        )}
      </form>

      {/* Comments */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 text-sm">Loading discussion...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10">
          <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No comments yet. Be the first to start the conversation!</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {comments.map((c) => (
            <Comment key={c.id} comment={c} currentUserId={user?.id} onLike={handleLike} />
          ))}
        </div>
      )}
    </div>
  );
}
