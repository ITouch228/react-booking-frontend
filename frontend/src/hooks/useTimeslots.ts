import { useState, useEffect } from 'react';
import { useApiClient } from '../api/apiClient';
import type { Timeslot } from '../types';

const useTimeSlots = (roomId: number | null, date: string) => {
  const { apiFetch } = useApiClient();
  const [timeSlots, setTimeSlots] = useState<Array<[number, number]>>([]);
  const [timeslotsLoading, setLoading] = useState(false);
  const [timeslotsError, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setTimeSlots([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchTimeSlots = async () => {
      setLoading(true);
      setError(null);

      try {
        let timeslots: Timeslot[];

        if (date) {
          const dateFrom = new Date(date);
          const dateTo = new Date(date);
          dateTo.setDate(dateTo.getDate() + 1);

          timeslots = await apiFetch<Timeslot[]>(
            `/rooms/${roomId}/timeslots?date_from=${dateFrom.toISOString()}&date_to=${dateTo.toISOString()}`,
            { signal: controller.signal },
          );
        } else {
          const nowDate = new Date();
          nowDate.setHours(0, 0, 0, 0);

          const tomorrowDate = new Date(nowDate);
          tomorrowDate.setDate(nowDate.getDate() + 1);

          timeslots = await apiFetch<Timeslot[]>(
            `/rooms/${roomId}/timeslots?date_from=${nowDate.toISOString()}&date_to=${tomorrowDate.toISOString()}`,
            { signal: controller.signal },
          );
        }

        if (controller.signal.aborted) return;

        const activeTimeslots = timeslots.filter(
          timeslot =>
            timeslot.has_active_booking && timeslot.status === 'AVAILABLE',
        );

        const formatedTimeslots: [number, number][] = activeTimeslots.map(
          ts => [
            new Date(ts.start_datetime).getHours(),
            new Date(ts.end_datetime).getHours(),
          ],
        );

        setTimeSlots(formatedTimeslots);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error ? err.message : 'Failed to fetch time slots',
        );
        setTimeSlots([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchTimeSlots();

    return () => {
      controller.abort();
    };
  }, [roomId, date, apiFetch]);

  return { timeSlots, timeslotsLoading, timeslotsError };
};

export default useTimeSlots;
