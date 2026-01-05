import { useState, useEffect } from 'react';
import { useApiClient } from '../services/apiClient';
import type { Booking } from '../types';

const useBookings = () => {
  const { apiFetch } = useApiClient();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setLoading] = useState(false);
  const [bookingsError, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchBookings = async () => {
      setLoading(true);
      setError(null);

      try {
        const bookings: Booking[] = await apiFetch<Booking[]>('/bookings', {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setBookings(bookings);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error ? err.message : 'Failed to fetch time slots',
        );
        setBookings([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchBookings();

    return () => {
      controller.abort();
    };
  }, [apiFetch]);

  return { bookings, setBookings, bookingsLoading, bookingsError };
};

export default useBookings;
