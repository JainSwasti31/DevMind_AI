import { useState } from 'react';
import { explainCode, generateReadme, suggestBugs } from '../utils/api.js';
import MarkdownRenderer from './MarkdownRenderer.jsx';

/**
 * AI Tools Panel — three tabs: Explain, README, Bugs
 * selectedFile is the file object from the repo currently shown in the preview.
 */
function AIToolsPanel({ repoId, selectedFile }) {
  const [activeTab, setActiveTab] = useState('explain');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearResult = () => { setResult(null); setError(null); };

  const run = async (fn) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await fn();
      const text = data.explanation || data.readme || data.suggestions || null;
      if (text) setResult(text);
      else setError(data.message || 'No result returned.');
    } catch {
      setError('Request failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const MAX_CODE_CHARS = 6000;

  const handleExplain = () => {
    if (!selectedFile) { setError('Select a file from the tree first.'); return; }
    const code = selectedFile.content.slice(0, MAX_CODE_CHARS);
    run(() => explainCode(repoId, { filePath: selectedFile.path, code }));
  };

  const handleReadme = () => {
    run(() => generateReadme(repoId));
  };

  const handleBugs = () => {
    if (selectedFile) {
      const code = selectedFile.content.slice(0, MAX_CODE_CHARS);
      run(() => suggestBugs(repoId, { filePath: selectedFile.path, code }));
    } else {
      run(() => suggestBugs(repoId));
    }
  };

  const tabs = [
    { id: 'explain', label: '🔍 Explain', action: handleExplain },
    { id: 'readme', label: '📄 README', action: handleReadme },
    { id: 'bugs', label: '🐛 Bugs', action: handleBugs },
  ];

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-lg shadow-slate-950/10 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-800 bg-slate-950/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setActiveTab(tab.id); clearResult(); }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-cyan-400 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Tab descriptions */}
        {activeTab === 'explain' && (
          <div className="mb-4">
            <p className="text-sm text-slate-400">
              {selectedFile
                ? <>Explain <span className="text-cyan-300 font-mono text-xs">{selectedFile.path}</span> ({selectedFile.lineCount} lines)</>
                : 'Select a file in the tree to explain it.'}
            </p>
          </div>
        )}
        {activeTab === 'readme' && (
          <div className="mb-4">
            <p className="text-sm text-slate-400">
              Generate a full README.md for this repository based on all source files.
            </p>
          </div>
        )}
        {activeTab === 'bugs' && (
          <div className="mb-4">
            <p className="text-sm text-slate-400">
              {selectedFile
                ? <>Review <span className="text-cyan-300 font-mono text-xs">{selectedFile.path}</span> for bugs and improvements.</>
                : 'No file selected — will review the full repository.'}
            </p>
          </div>
        )}

        {/* Run button */}
        <button
          type="button"
          onClick={tabs.find((t) => t.id === activeTab)?.action}
          disabled={loading}
          className="rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner /> Running…
            </span>
          ) : (
            { explain: 'Explain code', readme: 'Generate README', bugs: 'Find bugs' }[activeTab]
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-widest">Result</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="rounded-xl border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:text-white transition"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={clearResult}
                  className="rounded-xl border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:text-rose-300 transition"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="max-h-[480px] overflow-y-auto rounded-2xl bg-slate-950/60 border border-slate-800 p-4">
              <MarkdownRenderer content={result} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="inline-block h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default AIToolsPanel;
