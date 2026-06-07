import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRepositories, deleteRepository } from '../utils/api.js';
import { SkeletonRepo } from '../components/Skeleton.jsx';

function Dashboard() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { loadRepos(); }, []);

  const loadRepos = async () => {
    setLoading(true);
    try {
      const result = await fetchRepositories();
      if (result.repositories) { setRepos(result.repositories); setError(null); }
      else setError(result.message || 'Unable to load repositories.');
    } catch { setError('Failed to fetch repository data.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (repoId, repoName) => {
    if (!confirm(`Delete "${repoName}"? This also removes its chat history and cannot be undone.`)) return;
    setDeletingId(repoId);
    try {
      await deleteRepository(repoId);
      setRepos((prev) => prev.filter((r) => r._id !== repoId));
    } catch { alert('Failed to delete repository.'); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Repositories</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? 'Loading…' : `${repos.length} repositor${repos.length !== 1 ? 'ies' : 'y'}`}
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 rounded-xl gradient-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition shadow-lg"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New
        </Link>
      </div>

      {/* Stats bar */}
      {!loading && repos.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Repositories" value={repos.length} icon="📦" />
          <StatCard label="Total files" value={repos.reduce((a, r) => a + r.files.length, 0).toLocaleString()} icon="📄" />
          <StatCard label="Languages" value={new Set(repos.flatMap((r) => r.files.map((f) => f.language))).size} icon="🗂️" />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <SkeletonRepo />
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-300">{error}</div>
      ) : repos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {repos.map((repo) => (
            <RepoCard key={repo._id} repo={repo} deleting={deletingId === repo._id} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-900/60 px-5 py-4">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 p-16 text-center">
      <div className="text-5xl mb-4">🐙</div>
      <p className="text-slate-300 font-semibold">No repositories yet</p>
      <p className="mt-2 text-sm text-slate-500 mb-6">Import a GitHub repo or upload a ZIP to get started.</p>
      <Link to="/upload" className="inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Import first repo
      </Link>
    </div>
  );
}

function RepoCard({ repo, deleting, onDelete }) {
  return (
    <div className="group rounded-2xl border border-white/8 bg-slate-900/60 p-5 hover:border-white/15 hover:bg-slate-900/90 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-sm font-semibold text-white truncate">{repo.name}</h2>
            {repo.meta?.url && (
              <a href={repo.meta.url} target="_blank" rel="noopener noreferrer"
                className="shrink-0 text-slate-600 hover:text-cyan-400 transition"
                title="View on GitHub" onClick={(e) => e.stopPropagation()}>
                <GitHubIcon />
              </a>
            )}
          </div>
          {repo.meta?.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mb-2">{repo.meta.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span>{repo.files.length} file{repo.files.length !== 1 ? 's' : ''}</span>
            {repo.meta?.stars != null && <span>⭐ {repo.meta.stars.toLocaleString()}</span>}
            <span>{new Date(repo.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to={`/repos/${repo._id}`}
            className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition">
            Open
          </Link>
          <button type="button" disabled={deleting} onClick={() => onDelete(repo._id, repo.name)}
            className="rounded-xl border border-white/8 px-3 py-1.5 text-xs text-slate-500 hover:border-rose-500/30 hover:text-rose-400 disabled:opacity-40 transition">
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      </div>

      <LanguagePills files={repo.files} />
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function LanguagePills({ files }) {
  const counts = {};
  for (const f of files) counts[f.language] = (counts[f.language] || 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!sorted.length) return null;

  const colorMap = {
    JavaScript: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    TypeScript: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Python: 'bg-green-500/10 text-green-400 border-green-500/20',
    'C#': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Go: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    Java: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    HTML: 'bg-red-500/10 text-red-400 border-red-500/20',
    CSS: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    JSON: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    Markdown: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {sorted.map(([lang, count]) => (
        <span key={lang} className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colorMap[lang] || 'bg-slate-700/20 text-slate-400 border-slate-600/20'}`}>
          {lang} · {count}
        </span>
      ))}
    </div>
  );
}

export default Dashboard;
