import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const API_KEY_STORAGE = 'devmindai_user_gemini_key';

function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '');
  const [showKey, setShowKey] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveApiKey = () => {
    const trimmed = apiKey.trim();
    if (trimmed) {
      localStorage.setItem(API_KEY_STORAGE, trimmed);
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account and API preferences.</p>
      </div>

      {/* Profile section */}
      <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-slate-400 mb-1.5 block">Name</span>
              <input
                type="text"
                defaultValue={user?.name || ''}
                className="input-field"
                placeholder="Your name"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-400 mb-1.5 block">Email</span>
              <input
                type="email"
                defaultValue={user?.email || ''}
                disabled
                className="input-field opacity-60 cursor-not-allowed"
              />
            </label>
          </div>
          <button
            type="submit"
            className="rounded-xl gradient-brand px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            {saved ? '✓ Saved' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* API Key section */}
      <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-6">
        <h2 className="text-sm font-semibold text-white mb-1">Gemini API Key</h2>
        <p className="text-xs text-slate-500 mb-4">
          Use your own Gemini API key for AI features. Get one free at{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition">
            aistudio.google.com
          </a>.
          {' '}If left empty, the server's default key is used.
        </p>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="input-field pr-20 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 transition"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveApiKey}
              className="rounded-xl gradient-brand px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
            >
              {saved ? '✓ Saved' : 'Save API key'}
            </button>
            {apiKey && (
              <button
                type="button"
                onClick={() => { setApiKey(''); localStorage.removeItem(API_KEY_STORAGE); }}
                className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition"
              >
                Remove key
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-600">
            Your key is stored locally in your browser only. It is sent to the server with each AI request
            and never saved on our servers.
          </p>
        </div>
      </div>

      {/* Preferences section */}
      <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Appearance</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-200">Theme</p>
              <p className="text-xs text-slate-500">Switch between dark and light modes</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-black/30 border border-white/5 p-1">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  theme === 'dark'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  theme === 'light'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
                Light
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
