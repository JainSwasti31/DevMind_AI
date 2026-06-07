import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const BREADCRUMBS = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/upload': 'Add Repository',
  '/auth': 'Sign In',
};

function Navbar({ sidebarCollapsed }) {
  const { user } = useAuth();
  const location = useLocation();

  const isRepoDetail = location.pathname.startsWith('/repos/');
  const label = isRepoDetail ? 'Repository' : (BREADCRUMBS[location.pathname] || 'DevMind AI');

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 flex items-center px-6 border-b border-white/5 transition-all duration-300"
      style={{
        left: sidebarCollapsed ? '60px' : '240px',
        background: 'rgba(8, 12, 24, 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Page title / breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">DevMind AI</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-slate-600">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <span className="font-medium text-slate-200">{label}</span>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <>
            {/* Quick add button */}
            <Link
              to="/upload"
              className="flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New repo
            </Link>

            {/* User pill */}
            <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/8 px-3 py-1.5">
              <div className="h-5 w-5 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-white uppercase">
                {user.name?.[0] || '?'}
              </div>
              <span className="text-xs font-medium text-slate-300">{user.name}</span>
            </div>
          </>
        ) : (
          <Link
            to="/auth"
            className="rounded-xl gradient-brand px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

export default Navbar;
