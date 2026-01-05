import { useState, useEffect } from 'react';
import { useApiClient } from '../services/apiClient';
import type { Room } from '../types';

const useRooms = () => {
  const { apiFetch } = useApiClient();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setLoading] = useState(false);
  const [roomsError, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchRooms = async () => {
      setLoading(true);
      setError(null);

      try {
        const rooms = await apiFetch<Room[]>(
          '/rooms',
          { signal: controller.signal },
          { auth: false },
        );

        if (controller.signal.aborted) return;

        setRooms(rooms);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (controller.signal.aborted) return;

        setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
        setRooms([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRooms();

    return () => {
      controller.abort();
    };
  }, [apiFetch]);

  return { rooms, roomsLoading, roomsError };
};

export default useRooms;
