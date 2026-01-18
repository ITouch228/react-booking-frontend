import { useEffect, useMemo, useRef, useState } from 'react';
import { useApiClient } from '../services/apiClient';
import { buildQuery } from '../utils/utils';
import type { Room, RoomFilters } from '../types';

const useRooms = (filters: RoomFilters) => {
  const { apiFetch } = useApiClient();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setLoading] = useState(false);
  const [roomsError, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const abortRef = useRef<AbortController | null>(null);

  const shouldAppend = filters.page > 0;

  const query = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchRooms = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<Room[]>(
          `/rooms?${query}`,
          { signal: controller.signal },
          { auth: false },
        );

        if (controller.signal.aborted) return;

        setRooms(prev => (shouldAppend ? [...prev, ...data] : data));
        setHasMore(data.length === filters.limit);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (controller.signal.aborted) return;

        setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
        if (!shouldAppend) setRooms([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchRooms();

    return () => controller.abort();
  }, [apiFetch, query, shouldAppend, filters.limit]);

  return { rooms, roomsLoading, roomsError, hasMore };
};

export default useRooms;
