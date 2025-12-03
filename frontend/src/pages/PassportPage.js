import React from 'react';
import AnimePassport from '../components/AnimePassport';

export default function PassportPage({ user }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold text-white mb-2">Your Anime Passport</h1>
            <p className="text-sm sm:text-base text-gray-400">
              Your fandom identity, journey, and achievements in the anime community
            </p>
          </div>
          
          <AnimePassport user={user} />
        </div>
      </div>
    </div>
  );
}