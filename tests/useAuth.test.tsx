import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useAuth from '../src/hooks/useAuth';
import { AuthContext } from '../src/hooks/authContext';
import type { AuthContextType } from '../src/types';

describe('useAuth hook', () => {
  const mockUser = {
    username: 'testuser',
    email: 'test@example.com',
    role: 'USER' as const,
  };

  const mockAuthContextValue: AuthContextType = {
    user: mockUser,
    accessToken: 'mock-token',
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    setAccessToken: vi.fn(),
  };

  it('should return auth context value when used within AuthProvider', () => {
    const contextWrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockAuthContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper: contextWrapper });

    expect(result.current).toEqual(mockAuthContextValue);
  });

  it('should throw an error when used outside of AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');
  });

  it('should return updated context values after context changes', async () => {
    const updatedUser = {
      username: 'updateduser',
      email: 'updated@example.com',
      role: 'ADMIN' as const,
    };

    const updatedContextValue: AuthContextType = {
      ...mockAuthContextValue,
      user: updatedUser,
      accessToken: 'updated-token',
    };

    const contextWrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={updatedContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper: contextWrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(updatedUser);
      expect(result.current.accessToken).toBe('updated-token');
    });
  });
});
