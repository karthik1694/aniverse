import React from 'react';
import AnimePassport from '../components/AnimePassport';

export default function PassportPage({ user }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Your Anime Passport</h1>
            <p className="text-gray-400">
              Your fandom identity, journey, and achievements in the anime community
            </p>
          </div>
          
          <AnimePassport user={user} />
        </div>
      </div>
    </div>
  );
}