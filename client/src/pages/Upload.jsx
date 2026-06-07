import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { importFromGitHub, uploadRepository } from '../utils/api.js';

function Upload() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('github'); // 'github' | 'file'

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Mode switcher */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/40">
        <h1 className="text-3xl font-semibold text-white">Add repository</h1>
        <p className="mt-3 text-slate-300">
          Import from GitHub or upload a ZIP archive. DevMind will parse and index every supported file.
        </p>
        <div className="mt-6 flex gap-2 rounded-2xl bg-slate-950/80 p-1 w-fit">
          <button
            type="button"
            onClick={() => setMode('github')}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition ${mode === 'github' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            GitHub URL
          </button>
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition ${mode === 'file' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Upload ZIP
          </button>
        </div>
      </div>

      {mode === 'github' ? (
        <GitHubImportForm navigate={navigate} />
      ) : (
        <FileUploadForm navigate={navigate} />
      )}
    </div>
  );
}

// ─── GitHub import form ───────────────────────────────────────────────────────

function GitHubImportForm({ navigate }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) { setStatus({ type: 'error', text: 'Please enter a GitHub URL.' }); return; }
    if (!url.includes('github.com')) { setStatus({ type: 'error', text: 'URL must be a github.com link.' }); return; }

    setLoading(true);
    setStatus({ type: 'info', text: 'Fetching repository from GitHub…' });

    try {
      const result = await importFromGitHub(url.trim());
      if (result.repository) {
        setStatus({ type: 'success', text: `Imported "${result.repository.name}" with ${result.repository.files.length} files.` });
        setTimeout(() => navigate(`/repos/${result.repository._id}`), 1200);
      } else {
        setStatus({ type: 'error', text: result.message || 'Import failed.' });
      }
    } catch {
      setStatus({ type: 'error', text: 'Request failed. Make sure the server is running.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/40 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Import from GitHub</h2>
        <p className="mt-1 text-sm text-slate-400">
          Paste any public GitHub repository URL. Private repos require a{' '}
          <code className="text-cyan-400 text-xs">GITHUB_TOKEN</code> in your server <code className="text-cyan-400 text-xs">.env</code>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-200">
          GitHub URL
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repository"
            className="mt-2 block w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 transition placeholder:text-slate-600 font-mono text-sm"
            disabled={loading}
          />
        </label>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="w-full rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Importing…
            </span>
          ) : (
            'Import repository'
          )}
        </button>
      </form>

      {status && <StatusBanner status={status} />}

      {/* Examples */}
      <div className="border-t border-slate-800 pt-4">
        <p className="text-xs text-slate-500 mb-2">Example URLs</p>
        <div className="space-y-1.5">
          {[
            'https://github.com/facebook/react',
            'https://github.com/expressjs/express',
            'https://github.com/owner/repo/tree/main/src',
          ].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setUrl(ex)}
              className="block w-full text-left rounded-xl px-3 py-2 font-mono text-xs text-slate-400 hover:bg-slate-800 hover:text-cyan-300 transition"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── File upload form ─────────────────────────────────────────────────────────

function FileUploadForm({ navigate }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setStatus({ type: 'error', text: 'Please choose a file.' }); return; }
    const formData = new FormData();
    formData.append('archive', file);
    formData.append('name', name || file.name.replace(/\.zip$/i, ''));
    setLoading(true);
    setStatus(null);
    try {
      const result = await uploadRepository(formData);
      if (result.repository) {
        setStatus({ type: 'success', text: `Uploaded "${result.repository.name}" with ${result.repository.files.length} files.` });
        setTimeout(() => navigate(`/repos/${result.repository._id}`), 1200);
      } else {
        setStatus({ type: 'error', text: result.message || 'Upload failed.' });
      }
    } catch {
      setStatus({ type: 'error', text: 'Upload failed. Check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/40 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Upload ZIP archive</h2>
        <p className="mt-1 text-sm text-slate-400">Upload a ZIP file or a single source file up to 50 MB.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-200">
          Repository name <span className="text-slate-500 font-normal">(optional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My project"
            className="mt-2 block w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 transition"
          />
        </label>

        <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 px-6 py-10 cursor-pointer hover:border-cyan-500/50 transition">
          <span className="text-3xl">{file ? '📄' : '📁'}</span>
          <span className="text-sm text-slate-400">{file ? file.name : 'Click to choose a ZIP or source file'}</span>
          <input
            type="file"
            accept=".zip,.js,.jsx,.ts,.tsx,.py,.json,.md,.html,.css,.scss,.java,.cs,.go,.rb,.php,.yaml,.yml"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="sr-only"
          />
        </label>

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <span className="flex items-center justify-center gap-2"><Spinner /> Uploading…</span> : 'Upload Repository'}
        </button>
      </form>

      {status && <StatusBanner status={status} />}
    </div>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function StatusBanner({ status }) {
  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    error:   'bg-rose-500/10 border-rose-500/20 text-rose-300',
    info:    'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[status.type] || styles.info}`}>
      {status.text}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default Upload;
