import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchRepository } from '../utils/api.js';
import ChatPanel from '../components/ChatPanel.jsx';
import AIToolsPanel from '../components/AIToolsPanel.jsx';
import { SkeletonCard } from '../components/Skeleton.jsx';

// ─── File tree builder ───────────────────────────────────────────────────────

const buildTree = (files) => {
  const root = { name: '', path: '', children: [] };
  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = root;
    parts.forEach((part, index) => {
      const existing = (current.children || []).find((child) => child.name === part);
      if (existing) { current = existing; return; }
      const node = {
        name: part,
        path: index === 0 ? part : `${current.path}/${part}`,
        children: [],
      };
      if (index === parts.length - 1) { node.file = file; node.children = undefined; }
      current.children = current.children || [];
      current.children.push(node);
      current = node;
    });
  });
  return root;
};

function FileTree({ node, selectFile, selectedPath }) {
  if (!node.children) return null;
  return (
    <ul className="space-y-1">
      {node.children.map((child) => (
        <li key={child.path}>
          {child.file ? (
            <button
              type="button"
              onClick={() => selectFile(child.file)}
              className={`w-full text-left rounded-xl px-3 py-2 text-sm transition ${
                selectedPath === child.file.path
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/20'
                  : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60'
              }`}
            >
              <span className="font-mono text-xs">{child.name}</span>
            </button>
          ) : (
            <details open className="group">
              <summary className="cursor-pointer list-none flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60 transition select-none">
                <span className="text-slate-600 group-open:rotate-90 transition-transform inline-block">▶</span>
                {child.name}
              </summary>
              <div className="ml-4 mt-1 border-l border-slate-800 pl-2">
                <FileTree node={child} selectFile={selectFile} selectedPath={selectedPath} />
              </div>
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

const VIEWS = { FILES: 'files', CHAT: 'chat', AI: 'ai' };

function RepositoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [repository, setRepository] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState(VIEWS.FILES);

  useEffect(() => {
    let cancelled = false;
    const loadRepo = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const result = await fetchRepository(id);
        if (cancelled) return;
        if (result.repository) {
          setRepository(result.repository);
          setSelectedFile(result.repository.files[0] ?? null);
          setError(null);
        } else {
          setError(result.message || 'Repository not found.');
        }
      } catch {
        if (!cancelled) setError('Unable to load repository.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadRepo();
    return () => { cancelled = true; };
  }, [id]);

  const tree = useMemo(
    () => (repository ? buildTree(repository.files) : null),
    [repository]
  );

  const tabs = [
    { id: VIEWS.FILES, label: '📁 Files' },
    { id: VIEWS.CHAT, label: '💬 Chat' },
    { id: VIEWS.AI, label: '✨ AI Tools' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/40">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              {repository?.name ?? 'Repository'}
            </h1>
            {repository && (
              <p className="mt-2 text-slate-400">
                {repository.files.length} file{repository.files.length !== 1 ? 's' : ''} ·{' '}
                Uploaded {new Date(repository.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <Link
            to="/dashboard"
            className="rounded-2xl bg-slate-800 px-5 py-3 text-sm text-slate-200 transition hover:bg-slate-700"
          >
            ← Dashboard
          </Link>
        </div>

        {/* View tabs */}
        {!loading && !error && repository && (
          <div className="mt-6 flex gap-2 rounded-2xl bg-slate-950/80 p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={`rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                  activeView === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-8 text-rose-200">
          {error}
        </div>
      ) : repository && tree ? (
        <>
          {/* ── Files view ── */}
          {activeView === VIEWS.FILES && (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
              {/* File tree */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10">
                <h2 className="text-lg font-semibold text-white mb-4">File tree</h2>
                <FileTree node={tree} selectFile={setSelectedFile} selectedPath={selectedFile?.path} />
              </div>

              {/* Preview */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10">
                <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-950/80 px-4 py-3">
                      <p className="font-mono text-sm font-semibold text-slate-200">{selectedFile.path}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedFile.language} · {selectedFile.lineCount} lines · {selectedFile.size} bytes
                      </p>
                    </div>
                    <pre className="max-h-[520px] overflow-auto rounded-3xl bg-slate-950 p-4 text-sm leading-6 text-slate-100 font-mono">
                      {selectedFile.content}
                    </pre>
                    <button
                      type="button"
                      onClick={() => setActiveView(VIEWS.AI)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                    >
                      ✨ Explain or review this file with AI →
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Choose a file to preview its contents.</p>
                )}
              </div>
            </div>
          )}

          {/* ── Chat view ── */}
          {activeView === VIEWS.CHAT && (
            <div className="h-[680px]">
              <ChatPanel repoId={id} />
            </div>
          )}

          {/* ── AI Tools view ── */}
          {activeView === VIEWS.AI && (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
              {/* Small file tree for context */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10">
                <h2 className="text-lg font-semibold text-white mb-1">Select file</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Pick a file to explain or review. Leave unselected to analyse the whole repo.
                </p>
                <FileTree node={tree} selectFile={setSelectedFile} selectedPath={selectedFile?.path} />
              </div>

              <AIToolsPanel repoId={id} selectedFile={selectedFile} />
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

export default RepositoryDetail;
