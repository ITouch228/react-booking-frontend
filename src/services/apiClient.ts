import { useCallback } from 'react';
import useAuth from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export function useApiClient() {
  const { setUser, accessToken, setAccessToken, logout } = useAuth();

  // Получение нового accessToken из refresh
  const refreshAccessToken = useCallback(
    async (signal?: AbortSignal | null) => {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal,
      });

      if (!res.ok) {
        await fetch(API_URL + '/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        throw new Error('Refresh не удался');
      }

      const data = await res.json();
      const newAccess = data.access_token;
      const newUser = data.user;

      setAccessToken(newAccess);
      setUser(newUser);

      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: newUser,
          accessToken: newAccess,
        }),
      );

      return newAccess as string;
    },
    [setUser, setAccessToken],
  );

  // Универсальный fetch с options и прокидыванием accessToken и авто его рефрешем
  const apiFetch = useCallback(
    async <T = unknown>(
      path: string,
      options: RequestInit = {},
      { auth = true }: { auth?: boolean } = {},
    ): Promise<T> => {
      const url = `${API_URL}${path}`;

      const tokenToUse = accessToken;
      const headers: Record<string, string> = {
        ...((options.headers as Record<string, string>) || {}),
      };

      if (auth && tokenToUse) {
        headers['Authorization'] = `Bearer ${tokenToUse}`;
      }

      if (
        !headers['Content-Type'] &&
        options.body &&
        !(options.body instanceof FormData)
      ) {
        headers['Content-Type'] = 'application/json';
      }

      let res: Response;

      try {
        res = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
          signal: options.signal,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') throw err;
        throw err;
      }

      if (auth && res.status === 401) {
        try {
          const newAccess = await refreshAccessToken(options.signal);

          const retryHeaders: Record<string, string> = {
            ...((options.headers as Record<string, string>) || {}),
            Authorization: `Bearer ${newAccess}`,
          };

          if (
            !retryHeaders['Content-Type'] &&
            options.body &&
            !(options.body instanceof FormData)
          ) {
            retryHeaders['Content-Type'] = 'application/json';
          }

          res = await fetch(url, {
            ...options,
            headers: retryHeaders,
            credentials: 'include',
            signal: options.signal,
          });
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError')
            throw err;

          logout();
          throw new Error('Сессия истекла, авторизуйтесь заново');
        }
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Ошибка запроса');
      }

      if (res.status === 204) return null as T;

      return (await res.json()) as T;
    },
    [accessToken, refreshAccessToken, logout],
  );

  return { apiFetch };
}
