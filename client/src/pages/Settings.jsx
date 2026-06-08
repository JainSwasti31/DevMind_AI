import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const API_KEY_STORAGE = 'devmindai_user_gemini_key';

function Settings() {
  const { user } = useAuth();
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
        <h2 className="text-sm font-semibold text-white mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-200">Theme</p>
              <p className="text-xs text-slate-500">Interface appearance</p>
            </div>
            <select className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-300 outline-none">
              <option>Dark</option>
              <option disabled>Light (coming soon)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
