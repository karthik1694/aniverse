import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { catalogApi } from '../api/catalog';
import AnimeCard from '../components/AnimeCard';
import useSeo from '../hooks/useSeo';

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const DAY_INDEX = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-xl bg-[#1a2332]" />
          <div className="h-3 bg-[#1a2332] rounded mt-2 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export default function SchedulePage() {
  const todayKey = DAY_INDEX[new Date().getDay()];
  const [schedule, setSchedule] = useState({});
  const [activeDay, setActiveDay] = useState(todayKey);
  const [loading, setLoading] = useState(true);

  useSeo({
    title: 'Weekly Anime Airing Schedule',
    description:
      'See exactly when new anime episodes air this week. Browse the full weekly broadcast schedule, track your shows, and never miss an episode discussion.',
    path: '/schedule',
    keywords: 'anime schedule, anime airing schedule, weekly anime calendar, what anime airs today, new anime episodes this week',
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setSchedule(await catalogApi.schedule());
      } catch (e) {
        console.error('Failed to load schedule', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items = schedule[activeDay] || [];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="w-6 h-6 text-cyan-400" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Weekly Airing Schedule</h1>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        New episodes dropping each day. Add shows to your watchlist so you never miss one.
      </p>

      {/* Day tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 -mx-1 px-1">
        {DAYS.map((day) => (
          <button
            key={day.key}
            onClick={() => setActiveDay(day.key)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeDay === day.key
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-[#1a2332] text-gray-300 hover:bg-[#222d42] border border-white/5'
            }`}
          >
            {day.label}
            {day.key === todayKey && (
              <span className={`ml-1.5 text-[10px] ${activeDay === day.key ? 'text-cyan-100' : 'text-cyan-400'}`}>
                • Today
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">No scheduled anime found for this day.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
          {items.map((anime) => (
            <AnimeCard key={anime.mal_id} anime={anime} />
          ))}
        </div>
      )}
    </div>
  );
}
