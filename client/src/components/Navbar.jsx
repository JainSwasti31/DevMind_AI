import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const BREADCRUMBS = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/upload': 'Add Repository',
  '/auth': 'Sign In',
  '/settings': 'Settings',
  '/help': 'Help & Docs',
};

function Navbar({ sidebarCollapsed }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isRepoDetail = location.pathname.startsWith('/repos/');
  const label = isRepoDetail ? 'Repository' : (BREADCRUMBS[location.pathname] || 'DevMind AI');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/dashboard');
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate('/');
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 flex items-center gap-4 px-6 border-b border-white/5 transition-all duration-300"
      style={{
        left: sidebarCollapsed ? '60px' : '240px',
        background: 'rgba(8, 12, 24, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm min-w-0">
        <Link to="/" className="text-slate-500 hover:text-slate-300 transition">DevMind AI</Link>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-slate-700 shrink-0">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <span className="font-medium text-slate-200 truncate">{label}</span>
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Search ── */}
      {user && (
        <div className="relative">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                placeholder="Search repositories…"
                className="w-52 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-500/50 transition"
              />
              <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="ml-1 p-1 text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:border-white/15 transition"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline rounded bg-white/5 border border-white/10 px-1 py-0.5 text-[10px] text-slate-600 font-mono ml-2">⌘K</kbd>
            </button>
          )}
        </div>
      )}

      {/* ── Notifications ── */}
      {user && (
        <button
          type="button"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition"
          title="Notifications"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          {/* Dot indicator */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 border border-[#060912]" />
        </button>
      )}

      {/* ── Quick add ── */}
      {user && (
        <Link
          to="/upload"
          className="flex items-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">New repo</span>
        </Link>
      )}

      {/* ── Profile dropdown ── */}
      {user ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/8 px-2.5 py-1.5 hover:bg-white/8 transition"
          >
            <div className="h-6 w-6 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-white uppercase">
              {user.name?.[0] || '?'}
            </div>
            <span className="hidden sm:inline text-xs font-medium text-slate-300 max-w-[80px] truncate">{user.name}</span>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-slate-500">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-slate-900 shadow-2xl z-50 overflow-hidden">
                {/* User info */}
                <div className="p-3 border-b border-white/5">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>

                <div className="py-1.5">
                  <DropdownLink to="/dashboard" icon="📊" label="Dashboard" onClick={() => setShowProfileMenu(false)} />
                  <DropdownLink to="/upload" icon="🐙" label="Import repository" onClick={() => setShowProfileMenu(false)} />
                  <DropdownLink to="/settings" icon="⚙️" label="Settings" onClick={() => setShowProfileMenu(false)} />
                  <DropdownLink to="/help" icon="❓" label="Help & Docs" onClick={() => setShowProfileMenu(false)} />
                </div>

                <div className="border-t border-white/5 py-1.5">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <span>🚪</span>
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <Link
          to="/auth"
          className="rounded-xl gradient-brand px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition shadow-md"
        >
          Sign in
        </Link>
      )}
    </header>
  );
}

function DropdownLink({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition"
    >
      <span>{icon}</span>
      {label}
    </Link>
  );
}

export default Navbar;
