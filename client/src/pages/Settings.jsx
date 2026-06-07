import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function Settings() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account preferences.</p>
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

      {/* Preferences section */}
      <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-200">AI Model</p>
              <p className="text-xs text-slate-500">Choose which model to use for AI features</p>
            </div>
            <select className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-300 outline-none">
              <option>Gemini 2.5 Flash</option>
              <option>Gemini 2.0 Flash</option>
            </select>
          </div>
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

      {/* Danger zone */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
        <h2 className="text-sm font-semibold text-rose-300 mb-2">Danger zone</h2>
        <p className="text-xs text-slate-500 mb-4">Permanently delete your account and all data.</p>
        <button
          type="button"
          disabled
          className="rounded-xl border border-rose-500/30 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Delete account (coming soon)
        </button>
      </div>
    </div>
  );
}

export default Settings;
