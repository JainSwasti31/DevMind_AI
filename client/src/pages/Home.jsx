import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const features = [
  { icon: '🔐', title: 'Secure Auth', desc: 'JWT access + refresh tokens with bcrypt hashing and protected routes.', accent: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20' },
  { icon: '🐙', title: 'GitHub Import', desc: 'Paste any public repo URL. DevMind fetches and indexes all source files automatically.', accent: 'from-violet-500/20 to-violet-500/5 border-violet-500/20' },
  { icon: '💬', title: 'Chat with Code', desc: 'Ask anything about your codebase. Relevant chunks are selected and answers stream in real time.', accent: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20' },
  { icon: '🔍', title: 'Code Explainer', desc: 'Get a detailed breakdown of any file — purpose, inputs, outputs, and edge cases.', accent: 'from-amber-500/20 to-amber-500/5 border-amber-500/20' },
  { icon: '📄', title: 'README Generator', desc: 'One click to generate a full README.md — features, stack, setup, and API reference.', accent: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20' },
  { icon: '🐛', title: 'Bug Finder', desc: 'AI reviews your code for bugs, security issues, and improvements with severity ratings.', accent: 'from-rose-500/20 to-rose-500/5 border-rose-500/20' },
];

const steps = [
  { n: '01', title: 'Create an account', desc: 'Sign up in seconds. Your credentials are secured with bcrypt + JWT.' },
  { n: '02', title: 'Import a repository', desc: 'Paste a GitHub URL or upload a ZIP. All source files are indexed automatically.' },
  { n: '03', title: 'Chat with your code', desc: 'Ask questions in plain English. The AI finds relevant chunks and answers live.' },
  { n: '04', title: 'Run AI tools', desc: 'Explain files, generate docs, or scan for bugs — all from the AI Tools tab.' },
];

function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-10">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-slate-900 to-[#060912] p-10 shadow-2xl">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-12 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Powered by Gemini 2.5 Flash
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            <span className="text-white">Code intelligence,</span><br />
            <span className="text-gradient">supercharged by AI</span>
          </h1>

          <p className="mt-5 text-lg text-slate-400 leading-relaxed max-w-xl">
            Import any GitHub repository, chat with your codebase, generate documentation,
            and catch bugs — all powered by Gemini AI.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <>
                <Link to="/upload" className="inline-flex items-center gap-2 rounded-2xl gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Import a repo
                </Link>
                <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">
                  View dashboard →
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="inline-flex items-center gap-2 rounded-2xl gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition">
                  Get started free
                </Link>
                <Link to="/auth" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">
                  Sign in →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-5">What you can do</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className={`rounded-2xl border bg-gradient-to-br ${f.accent} p-5 transition hover:scale-[1.01]`}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="rounded-3xl border border-white/8 bg-slate-900/60 p-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-8">How it works</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-slate-700 to-transparent z-0" />
              )}
              <div className="relative z-10">
                <div className="text-2xl font-bold text-gradient mb-3">{s.n}</div>
                <h3 className="text-sm font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
