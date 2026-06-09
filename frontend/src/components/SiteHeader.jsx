import React, { useState, useEffect } from 'react';
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
 * Shared top navigation header. On desktop the nav is inline; on mobile a
 * hamburger on the LEFT opens a slide-in sidebar that overlays the page.
 *
 * `leftSlot` lets a host (e.g. the chat layout) inject an extra control on the
 * far left, such as a button to open its own secondary sidebar.
 */
export default function SiteHeader({ user, setUser, leftSlot = null }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock body scroll while the sidebar is open.
  // We pin the body with position:fixed (capturing the current scroll offset and
  // restoring it on close) instead of just `overflow:hidden`. Plain overflow
  // hidden doesn't reliably stop the background page from moving/bouncing on
  // mobile, which caused the page to jitter while the sidebar was open.
  useEffect(() => {
    if (!mobileOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [mobileOpen]);

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
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0e1a]/90 backdrop-blur-xl flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: hamburger (mobile) + optional slot + logo + nav */}
            <div className="flex items-center gap-2 lg:gap-6 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 -ml-1.5 text-gray-200 hover:text-white"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
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

            {/* Center/Right: live search (desktop) */}
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
            </div>
          </div>
        </div>
      </header>

      {/* Mobile slide-in sidebar.
          Rendered OUTSIDE <header> on purpose: the header uses backdrop-filter,
          which would otherwise make this `fixed` overlay anchor to the header
          box instead of the viewport. */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[120]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-overlay-fade"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[82vw] bg-[#0d1119] border-r border-white/10 shadow-2xl flex flex-col animate-slide-in-left">
            {/* Sidebar header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <button onClick={() => { setMobileOpen(false); navigate('/'); }}>
                <BrandLogo />
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-white/5">
              <HeaderSearch onNavigate={() => setMobileOpen(false)} />
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1" style={{ overscrollBehavior: 'contain' }}>
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                      isActive ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-200 hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Footer: user / auth */}
            <div className="p-3 border-t border-white/5">
              {user ? (
                <div className="flex items-center gap-3">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                      {initial}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{user.name}</p>
                    <p className="text-[11px] text-gray-500">
                      {isAnonymousUser(user) ? 'Anonymous' : 'Signed in'}
                    </p>
                  </div>
                  {isAnonymousUser(user) && (
                    <button onClick={handleLogin} className="btn-inline text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1">
                      Claim
                    </button>
                  )}
                  <button onClick={handleLogout} className="btn-inline p-2 text-gray-400 hover:text-red-400" aria-label="Log out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2.5 rounded-lg"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
