import { useContext } from 'react';
import { AuthContext } from './authContext';
import type { AuthContextType } from '../types/index';

export default function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
