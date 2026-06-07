import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { logoutUser } from '../utils/auth.js';

const AuthContext = createContext(undefined);

const STORAGE_KEYS = {
  accessToken: 'devmindai_accessToken',
  refreshToken: 'devmindai_refreshToken',
  user: 'devmindai_user',
};

const load = (key, parse = false) => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  if (!parse) return raw;
  try { return JSON.parse(raw); } catch { return null; }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => load(STORAGE_KEYS.user, true));
  const [accessToken, setAccessToken] = useState(() => load(STORAGE_KEYS.accessToken));

  useEffect(() => {
    if (accessToken) localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    else localStorage.removeItem(STORAGE_KEYS.accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.user);
  }, [user]);

  const login = (newAccessToken, refreshToken, authUser) => {
    setAccessToken(newAccessToken);
    setUser(authUser);
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    // Invalidate token server-side (best-effort)
    if (refreshToken) await logoutUser(refreshToken);
    setAccessToken(null);
    setUser(null);
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  };

  const value = useMemo(
    () => ({ user, accessToken, login, logout }),
    [accessToken, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
