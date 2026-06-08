import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-24 pb-20 -mt-2">

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-b from-slate-900 to-[#060912] px-8 py-20 md:px-16 md:py-28">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-violet-500/8 blur-[100px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-indigo-500/5 blur-[80px]" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] tracking-tight">
            <span className="text-white">Understand any codebase</span><br />
            <span className="text-gradient">in seconds, not hours</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Import a GitHub repo. Ask questions in plain English. Get instant explanations,
            generated docs, and bug reports — powered by AI that actually reads your code.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {user ? (
              <>
                <Link to="/upload" className="group inline-flex items-center gap-2 rounded-2xl gradient-brand px-7 py-3.5 text-sm font-semibold text-white shadow-xl glow-cyan transition hover:scale-[1.02]">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 group-hover:rotate-90 transition-transform">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Import a repository
                </Link>
                <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">
                  Go to dashboard →
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="group inline-flex items-center gap-2 rounded-2xl gradient-brand px-7 py-3.5 text-sm font-semibold text-white shadow-xl glow-cyan transition hover:scale-[1.02]">
                  Get started free
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link to="/auth" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* Social proof / stats */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span>Stream responses in real time</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <span>Your code stays private</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🆓</span>
              <span>Free to use</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 mb-3">Features</h2>
          <p className="text-3xl md:text-4xl font-bold text-white">Everything you need to understand code</p>
          <p className="mt-3 text-slate-500 max-w-lg mx-auto">Six powerful tools — one platform. From quick explanations to comprehensive bug audits.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className={`group relative rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl ${f.border}`}>
              {/* subtle gradient bg */}
              <div className={`absolute inset-0 rounded-2xl opacity-60 ${f.bg}`} />
              <div className="relative">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400 mb-3">How it works</h2>
          <p className="text-3xl md:text-4xl font-bold text-white">From repo to insights in 4 steps</p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-10 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative text-center lg:text-left">
                <div className="relative z-10 mx-auto lg:mx-0 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-sm font-bold text-gradient">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-5">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tech stack ─── */}
      <section className="rounded-3xl border border-white/8 bg-slate-900/40 p-8 md:p-12">
        <div className="text-center mb-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">Built with</h2>
          <p className="text-2xl font-bold text-white">Modern tech stack</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TECH.map((t) => (
            <div key={t.name} className="flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] py-5 px-4 hover:border-white/10 transition">
              <span className="text-2xl">{t.icon}</span>
              <span className="text-xs font-medium text-slate-300">{t.name}</span>
              <span className="text-[10px] text-slate-600">{t.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden rounded-3xl border border-white/8 p-10 md:p-16 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5" />
        <div className="relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to understand your code?</h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-8">Import your first repository in under 30 seconds. No credit card required.</p>
          <Link to={user ? '/upload' : '/auth'} className="inline-flex items-center gap-2 rounded-2xl gradient-brand px-8 py-4 text-sm font-semibold text-white shadow-xl glow-cyan transition hover:scale-[1.02]">
            {user ? 'Import a repository' : 'Get started free'}
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="text-center text-xs text-slate-600 pt-4 border-t border-white/5">
        <p>© 2026 DevMind AI · Your code, understood.</p>
      </footer>
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: '🐙', title: 'GitHub Import', desc: 'Paste any public repo URL. All source files are fetched, parsed, and indexed automatically.', bg: 'bg-gradient-to-br from-violet-500/10 to-transparent', border: 'border-violet-500/15' },
  { icon: '💬', title: 'Chat with Code', desc: 'Ask anything in natural language. Relevant code chunks are selected and answers stream in real time.', bg: 'bg-gradient-to-br from-indigo-500/10 to-transparent', border: 'border-indigo-500/15' },
  { icon: '🔍', title: 'Code Explainer', desc: 'Select any file and get a detailed breakdown — purpose, logic flow, inputs, outputs, and edge cases.', bg: 'bg-gradient-to-br from-amber-500/10 to-transparent', border: 'border-amber-500/15' },
  { icon: '📄', title: 'README Generator', desc: 'One click generates a full README.md — features, stack, installation, API docs, and more.', bg: 'bg-gradient-to-br from-emerald-500/10 to-transparent', border: 'border-emerald-500/15' },
  { icon: '🐛', title: 'Bug Finder', desc: 'AI reviews your code for bugs, security vulnerabilities, and improvements with severity ratings.', bg: 'bg-gradient-to-br from-rose-500/10 to-transparent', border: 'border-rose-500/15' },
  { icon: '🔐', title: 'Secure by Default', desc: 'JWT auth with refresh tokens, bcrypt hashing, rate limiting, and CORS protection built in.', bg: 'bg-gradient-to-br from-cyan-500/10 to-transparent', border: 'border-cyan-500/15' },
];

const STEPS = [
  { title: 'Create an account', desc: 'Sign up in seconds. Credentials are hashed and secured with JWT.' },
  { title: 'Import a repository', desc: 'Paste a GitHub URL or upload a ZIP. All supported source files are indexed.' },
  { title: 'Chat with your code', desc: 'Ask questions. The AI selects the most relevant chunks and streams answers.' },
  { title: 'Run AI tools', desc: 'Explain files, generate docs, or audit for bugs — all from one interface.' },
];

const TECH = [
  { icon: '⚛️', name: 'React 19', desc: 'Frontend' },
  { icon: '🟢', name: 'Node.js', desc: 'Backend' },
  { icon: '🍃', name: 'MongoDB', desc: 'Database' },
  { icon: '✨', name: 'Gemini AI', desc: 'Intelligence' },
  { icon: '⚡', name: 'Vite', desc: 'Build tool' },
  { icon: '🎨', name: 'Tailwind', desc: 'Styling' },
  { icon: '🔑', name: 'JWT', desc: 'Auth' },
  { icon: '🐙', name: 'GitHub API', desc: 'Import' },
];

export default Home;
