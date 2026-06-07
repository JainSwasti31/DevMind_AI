import { Link } from 'react-router-dom';

const FAQS = [
  {
    q: 'How do I import a repository?',
    a: 'Go to "Add Repository" and paste any public GitHub URL (e.g. https://github.com/owner/repo). DevMind will fetch and index all supported source files automatically.',
  },
  {
    q: 'What file types are supported?',
    a: '.js, .jsx, .ts, .tsx, .py, .java, .cs, .go, .rb, .php, .html, .css, .scss, .md, .json, .yaml, .yml',
  },
  {
    q: 'Can I use private repositories?',
    a: 'Yes! Add a GitHub Personal Access Token with "repo" scope to GITHUB_TOKEN in your server environment variables.',
  },
  {
    q: 'How does the AI chat work?',
    a: 'DevMind splits your repository into chunks, scores them against your question using keyword matching, and sends the most relevant chunks to Gemini AI with your question. Answers stream in real time.',
  },
  {
    q: 'Is my code stored securely?',
    a: 'Yes. Code is stored in MongoDB with user-scoped access. Only you can see your repositories. All API calls are protected with JWT authentication.',
  },
  {
    q: 'What AI model is used?',
    a: 'DevMind uses Google Gemini 2.5 Flash by default, with automatic fallback to Gemini 2.0 Flash if the primary model is unavailable.',
  },
  {
    q: 'Why am I getting "quota exceeded" errors?',
    a: 'The free tier of Gemini has rate limits (15 requests/minute). Wait a minute and try again, or add billing to your Google AI Studio account for higher limits.',
  },
];

const SHORTCUTS = [
  { keys: '⌘ + K', action: 'Open search' },
  { keys: 'Enter', action: 'Send chat message' },
  { keys: 'Shift + Enter', action: 'New line in chat' },
];

function Help() {
  return (
    <div className="max-w-3xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Help & Documentation</h1>
        <p className="mt-1 text-sm text-slate-500">Everything you need to know about using DevMind AI.</p>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickCard icon="🚀" title="Getting Started" desc="Import your first repo" to="/upload" />
        <QuickCard icon="💬" title="AI Chat" desc="Chat with your code" to="/dashboard" />
        <QuickCard icon="⚙️" title="Settings" desc="Configure your account" to="/settings" />
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-6">
        <h2 className="text-sm font-semibold text-white mb-5">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group">
              <summary className="flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/5 transition select-none">
                {faq.q}
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <div className="px-4 pb-3 pt-1 text-xs text-slate-400 leading-5">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.action} className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs text-slate-400">{s.action}</span>
              <kbd className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-[11px] text-slate-400 font-mono">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-6 text-center">
        <p className="text-sm text-slate-300 mb-2">Still need help?</p>
        <p className="text-xs text-slate-500">
          Open an issue on{' '}
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition">
            GitHub
          </a>{' '}
          or check the README for detailed setup instructions.
        </p>
      </div>
    </div>
  );
}

function QuickCard({ icon, title, desc, to }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.02] py-6 px-4 hover:border-white/15 hover:bg-white/[0.04] transition text-center"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium text-white">{title}</span>
      <span className="text-[11px] text-slate-500">{desc}</span>
    </Link>
  );
}

export default Help;
