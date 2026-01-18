import { useEffect, useState } from 'react';
import { useApiClient } from '../services/apiClient';
import type { Room } from '../types';

export function useRoom(roomId: number | null) {
  const { apiFetch } = useApiClient();
  const [room, setRoom] = useState<Room | null>(null);
  const [roomLoading, setLoading] = useState(false);
  const [roomError, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setError(null);
      setLoading(false);
      return;
    }

    const c = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<Room>(
          `/rooms/${roomId}`,
          { signal: c.signal },
          { auth: false },
        );
        if (!c.signal.aborted) setRoom(data);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        if (!c.signal.aborted)
          setError(e instanceof Error ? e.message : 'Failed to fetch room');
      } finally {
        if (!c.signal.aborted) setLoading(false);
      }
    })();

    return () => c.abort();
  }, [roomId, apiFetch]);

  return { room, roomLoading, roomError };
}
