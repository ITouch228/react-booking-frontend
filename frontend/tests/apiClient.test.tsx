import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useApiClient } from '../src/services/apiClient';
import { AuthContext } from '../src/hooks/authContext';
import type { AuthContextType } from '../src/types';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

let mockCookies = '';
Object.defineProperty(document, 'cookie', {
  set: value => {
    mockCookies = value;
  },
  get: () => mockCookies,
  configurable: true,
});

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const mockAuthContext: AuthContextType = {
    user: { username: 'testuser', email: 'test@example.com', role: 'USER' },
    accessToken: 'mock-token',
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    setAccessToken: vi.fn(),
  };

  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};

type FetchCall = Parameters<typeof fetch>;
type FetchOptions = NonNullable<FetchCall[1]>;
type FetchHeaders = FetchOptions['headers'];

const getHeaderValue = (headers: FetchHeaders | undefined, key: string) => {
  if (!headers) return undefined;
  if (headers instanceof Headers) return headers.get(key) ?? undefined;
  if (Array.isArray(headers)) {
    const found = headers.find(([k]) => k.toLowerCase() === key.toLowerCase());
    return found?.[1];
  }
  return (headers as Record<string, string>)[key];
};

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies = '';

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  it('should make a successful API request', async () => {
    const mockResponse = { data: 'test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
      text: async () => JSON.stringify(mockResponse),
    });

    const { result } = renderHook(() => useApiClient(), {
      wrapper: MockAuthProvider,
    });

    const response = await result.current.apiFetch('/test');

    expect(response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0] as FetchCall;

    expect(String(url)).toContain('/test');
    expect(options).toBeTruthy();
    expect((options as FetchOptions).credentials).toBe('include');

    const auth = getHeaderValue(
      (options as FetchOptions).headers,
      'Authorization',
    );
    expect(auth).toBe('Bearer mock-token');
  });

  it('should handle 401 error with token refresh', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
      json: async () => {
        throw new Error('no json');
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 'refreshed' }),
      text: async () => JSON.stringify({ data: 'refreshed' }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'new-token',
        user: { username: 'newuser' },
      }),
      text: async () =>
        JSON.stringify({
          access_token: 'new-token',
          user: { username: 'newuser' },
        }),
    });

    const { result } = renderHook(() => useApiClient(), {
      wrapper: MockAuthProvider,
    });

    const response = await result.current.apiFetch('/test');

    expect(response).toEqual({
      access_token: 'new-token',
      user: { username: 'newuser' },
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should handle 401 error and logout when refresh fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
        json: async () => {
          throw new Error('no json');
        },
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Refresh failed',
        json: async () => {
          throw new Error('no json');
        },
      });

    const mockLogout = vi.fn();
    const MockAuthProviderWithLogout = ({
      children,
    }: {
      children: React.ReactNode;
    }) => {
      const mockAuthContext: AuthContextType = {
        user: { username: 'testuser', email: 'test@example.com', role: 'USER' },
        accessToken: 'mock-token',
        login: vi.fn(),
        logout: mockLogout,
        setUser: vi.fn(),
        setAccessToken: vi.fn(),
      };

      return (
        <AuthContext.Provider value={mockAuthContext}>
          {children}
        </AuthContext.Provider>
      );
    };

    const { result } = renderHook(() => useApiClient(), {
      wrapper: MockAuthProviderWithLogout,
    });

    await expect(result.current.apiFetch('/test')).rejects.toThrow(
      'Сессия истекла, авторизуйтесь заново',
    );
    expect(mockLogout).toHaveBeenCalled();
  });

  it('should handle non-JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: async () => '',
      json: async () => {
        throw new Error('Unexpected end of JSON input');
      },
    });

    const { result } = renderHook(() => useApiClient(), {
      wrapper: MockAuthProvider,
    });

    const response = await result.current.apiFetch('/test');

    expect(response).toBeNull();
  });

  it('should handle request errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Server error',
      json: async () => {
        throw new Error('no json');
      },
    });

    const { result } = renderHook(() => useApiClient(), {
      wrapper: MockAuthProvider,
    });

    await expect(result.current.apiFetch('/test')).rejects.toThrow(
      'Server error',
    );
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useApiClient(), {
      wrapper: MockAuthProvider,
    });

    await expect(result.current.apiFetch('/test')).rejects.toThrow(
      'Network error',
    );
  });

  it('should handle AbortError correctly', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    mockFetch.mockRejectedValueOnce(abortError);

    const { result } = renderHook(() => useApiClient(), {
      wrapper: MockAuthProvider,
    });

    await expect(result.current.apiFetch('/test')).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('should not include Authorization header when auth is disabled', async () => {
    const mockResponse = { data: 'test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
      text: async () => JSON.stringify(mockResponse),
    });

    const { result } = renderHook(() => useApiClient(), {
      wrapper: MockAuthProvider,
    });

    const response = await result.current.apiFetch(
      '/test',
      {},
      { auth: false },
    );

    expect(response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [, options] = mockFetch.mock.calls[0] as FetchCall;

    expect(options).toBeTruthy();
    expect((options as FetchOptions).credentials).toBe('include');

    const auth = getHeaderValue(
      (options as FetchOptions).headers,
      'Authorization',
    );
    expect(auth).toBeUndefined();
  });

  it('should handle FormData requests correctly', async () => {
    const formData = new FormData();
    formData.append('test', 'value');

    const mockResponse = { data: 'test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
      text: async () => JSON.stringify(mockResponse),
    });

    const { result } = renderHook(() => useApiClient(), {
      wrapper: MockAuthProvider,
    });

    const response = await result.current.apiFetch('/test', {
      method: 'POST',
      body: formData,
    });

    expect(response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0] as FetchCall;

    expect(String(url)).toContain('/test');
    expect(options).toBeTruthy();
    expect((options as FetchOptions).body).toBe(formData);

    const contentType = getHeaderValue(
      (options as FetchOptions).headers,
      'Content-Type',
    );
    expect(contentType).not.toBe('application/json');
  });
});
