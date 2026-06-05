import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Compass, CalendarDays, Bookmark, MessageCircle, MessagesSquare, Shuffle, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import BrandLogo from './BrandLogo';
import HeaderSearch from './HeaderSearch';
import { isAnonymousUser, clearAnonymousSession } from '../utils/anonymousAuth';

export const NAV_ITEMS = [
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/watchlist', label: 'My List', icon: Bookmark },
  { to: '/community', label: 'Community', icon: MessagesSquare },
  { to: '/chat', label: 'Chat', icon: Shuffle },
];

/**
 * Shared top navigation header used across the whole site (content pages and chat),
 * so navigation stays consistent and there's always a clear way back home.
 *
 * `leftSlot` lets a host (e.g. the chat layout) inject an extra control on the far
 * left, such as a button to open its own secondary sidebar on mobile.
 */
export default function SiteHeader({ user, setUser, leftSlot = null }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleLogout = () => {
    clearAnonymousSession();
    localStorage.clear();
    sessionStorage.clear();
    if (setUser) setUser(null);
    window.location.href = '/';
  };

  const initial = (user?.name || 'A').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0e1a]/90 backdrop-blur-xl flex-shrink-0">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: optional slot + logo + nav */}
          <div className="flex items-center gap-3 lg:gap-6 min-w-0">
            {leftSlot}
            <button onClick={() => navigate('/')} className="flex-shrink-0">
              <BrandLogo />
            </button>
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-cyan-400 bg-cyan-500/10'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Center/Right: live search */}
          <HeaderSearch className="hidden md:block flex-1 max-w-xs" />

          {/* User area */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/5 transition-colors"
                >
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                      {initial}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm text-gray-200 max-w-[100px] truncate">{user.name}</span>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-[#1a2332] border border-white/10 rounded-xl shadow-xl py-1 z-50">
                      <button
                        onClick={() => { setMenuOpen(false); navigate('/watchlist'); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-white/5"
                      >
                        <Bookmark className="w-4 h-4" /> My Watchlist
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); navigate('/chat'); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-white/5"
                      >
                        <MessageCircle className="w-4 h-4" /> Chat
                      </button>
                      {isAnonymousUser(user) && (
                        <button
                          onClick={handleLogin}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-cyan-400 hover:bg-white/5"
                        >
                          <UserIcon className="w-4 h-4" /> Claim Account
                        </button>
                      )}
                      <div className="border-t border-white/5 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5"
                      >
                        <LogOut className="w-4 h-4" /> Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="text-sm text-gray-300 hover:text-white px-3 py-2 transition-colors"
              >
                Sign in
              </button>
            )}

            {/* Mobile nav toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 text-gray-300 hover:text-white"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/5 bg-[#0a0e1a] px-4 py-3 space-y-1">
          <HeaderSearch className="mb-2" onNavigate={() => setMobileOpen(false)} />
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-300 hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
