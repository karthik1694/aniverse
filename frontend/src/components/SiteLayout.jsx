import React from 'react';
import BrandLogo from './BrandLogo';
import SiteHeader from './SiteHeader';

export default function SiteLayout({ user, setUser, children }) {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      <SiteHeader user={user} setUser={setUser} />

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0e1a] mt-12">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <BrandLogo size="sm" />
            <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm">
              <a href="/discover" className="text-gray-400 hover:text-white transition-colors">Discover</a>
              <a href="/schedule" className="text-gray-400 hover:text-white transition-colors">Schedule</a>
              <a href="/community" className="text-gray-400 hover:text-white transition-colors">Community</a>
              <a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="/guidelines" className="text-gray-400 hover:text-white transition-colors">Guidelines</a>
              <a href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} OtakuCafe.fun — Track anime, join episode discussions, and connect with fellow otaku.
            </p>
            <p className="text-[11px] text-gray-600 mt-2">
              Anime data provided by MyAnimeList via the Jikan API. OtakuCafe is a fan community and is not affiliated with any studio or distributor.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
