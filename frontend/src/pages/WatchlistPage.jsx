import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Plus, Minus, Trash2, Tv, CheckCircle2, Clock, ListPlus } from 'lucide-react';
import { watchlist, STATUS_LABELS, STATUS_ORDER } from '../utils/watchlist';
import useSeo from '../hooks/useSeo';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-[#1a2332] border border-white/5 rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-white/5 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function WatchlistRow({ entry, onChange }) {
  const navigate = useNavigate();
  const [statusOpen, setStatusOpen] = useState(false);

  const adjustProgress = (delta) => {
    watchlist.setProgress(entry.mal_id, (entry.progress || 0) + delta);
    onChange();
  };

  const setStatus = (status) => {
    watchlist.setStatus(entry.mal_id, status);
    setStatusOpen(false);
    onChange();
  };

  const remove = () => {
    watchlist.remove(entry.mal_id);
    onChange();
  };

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 bg-[#1a2332] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
      <button onClick={() => navigate(`/anime/${entry.mal_id}/${entry.slug || ''}`)} className="flex-shrink-0">
        {entry.image_url ? (
          <img src={entry.image_url} alt={entry.title} className="w-12 h-16 sm:w-14 sm:h-20 object-cover rounded-lg" />
        ) : (
          <div className="w-12 h-16 sm:w-14 sm:h-20 bg-[#222d42] rounded-lg flex items-center justify-center">🎬</div>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <button
          onClick={() => navigate(`/anime/${entry.mal_id}/${entry.slug || ''}`)}
          className="text-sm font-semibold text-white hover:text-cyan-400 text-left line-clamp-1"
        >
          {entry.title}
        </button>

        {/* Progress */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => adjustProgress(-1)}
            disabled={(entry.progress || 0) <= 0}
            className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-gray-300"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-xs text-gray-400 tabular-nums min-w-[60px] text-center">
            {entry.progress || 0}{entry.episodes ? ` / ${entry.episodes}` : ''} eps
          </span>
          <button
            onClick={() => adjustProgress(1)}
            className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Progress bar */}
        {entry.episodes ? (
          <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden max-w-[200px]">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              style={{ width: `${Math.min(100, ((entry.progress || 0) / entry.episodes) * 100)}%` }}
            />
          </div>
        ) : null}
      </div>

      {/* Status selector */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setStatusOpen((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20"
        >
          {STATUS_LABELS[entry.status]}
        </button>
        {statusOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
            <div className="absolute right-0 mt-1 w-44 bg-[#11151f] border border-white/10 rounded-lg shadow-xl py-1 z-50">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 ${
                    entry.status === s ? 'text-cyan-400' : 'text-gray-300'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <button onClick={remove} className="flex-shrink-0 p-2 text-gray-500 hover:text-red-400 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function WatchlistPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: {}, episodesWatched: 0 });
  const [filter, setFilter] = useState('all');

  useSeo({
    title: 'My Anime Watchlist',
    description: 'Track the anime you are watching, completed, and plan to watch. Keep your episode progress in one place on OtakuCafe.',
    path: '/watchlist',
  });

  const refresh = useCallback(() => {
    setEntries(watchlist.getAll());
    setStats(watchlist.stats());
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('watchlist:changed', handler);
    return () => window.removeEventListener('watchlist:changed', handler);
  }, [refresh]);

  const visible = filter === 'all' ? entries : entries.filter((e) => e.status === filter);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Bookmark className="w-6 h-6 text-cyan-400" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Watchlist</h1>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[#1a2332] flex items-center justify-center mx-auto mb-4">
            <ListPlus className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Your watchlist is empty</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
            Add anime you're watching or want to watch. Your list and episode progress are saved on this device.
          </p>
          <button
            onClick={() => navigate('/discover')}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg shadow-cyan-500/30"
          >
            Discover anime to add
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard icon={Tv} label="Total" value={stats.total} accent="text-cyan-400" />
            <StatCard icon={Clock} label="Watching" value={stats.byStatus.watching || 0} accent="text-blue-400" />
            <StatCard icon={CheckCircle2} label="Completed" value={stats.byStatus.completed || 0} accent="text-green-400" />
            <StatCard icon={Bookmark} label="Episodes watched" value={stats.episodesWatched} accent="text-purple-400" />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label={`All (${stats.total})`} />
            {STATUS_ORDER.map((s) => (
              <FilterChip
                key={s}
                active={filter === s}
                onClick={() => setFilter(s)}
                label={`${STATUS_LABELS[s]} (${stats.byStatus[s] || 0})`}
              />
            ))}
          </div>

          {/* List */}
          {visible.length === 0 ? (
            <p className="text-center text-gray-500 py-10 text-sm">Nothing here yet.</p>
          ) : (
            <div className="space-y-2.5">
              {visible.map((entry) => (
                <WatchlistRow key={entry.mal_id} entry={entry} onChange={refresh} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
        active ? 'bg-cyan-500 text-white' : 'bg-[#1a2332] text-gray-300 hover:bg-[#222d42] border border-white/5'
      }`}
    >
      {label}
    </button>
  );
}
