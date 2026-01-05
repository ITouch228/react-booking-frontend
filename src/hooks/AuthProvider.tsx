import React, { useState } from 'react';
import type { AuthContextType, User } from '../types';
import { AuthContext } from '../hooks/authContext';

type AuthProviderProps = {
  children: React.ReactNode;
};

const getInitialUserState = (): User | null => {
  if (typeof window === 'undefined') return null;

  const saved = localStorage.getItem('auth');
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved) as { user?: User | null };
    return parsed.user ?? null;
  } catch {
    return null;
  }
};

const getInitialAccessState = (): string | null => {
  if (typeof window === 'undefined') return null;

  const saved = localStorage.getItem('auth');
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved) as { accessToken?: string | null };
    return parsed.accessToken ?? null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(getInitialUserState);
  const [accessToken, setAccessToken] = useState<string | null>(
    getInitialAccessState,
  );

  const saveAuthToStorage = (next: {
    user: User | null;
    accessToken: string | null;
  }) => {
    localStorage.setItem('auth', JSON.stringify(next));
  };

  const login: AuthContextType['login'] = ({ user, access_token }) => {
    setUser(user);
    setAccessToken(access_token);
    saveAuthToStorage({ user, accessToken: access_token });
  };

  const logout: AuthContextType['logout'] = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('auth');
  };

  const value: AuthContextType = {
    user,
    setUser,
    accessToken,
    login,
    logout,
    setAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
