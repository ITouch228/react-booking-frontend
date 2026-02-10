import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useTimeslots from '../src/hooks/useTimeslots';
import { useApiClient } from '../src/services/apiClient';
import type { Timeslot } from '../src/types';

// Мокаем модуль apiClient
vi.mock('../src/services/apiClient', () => ({
  useApiClient: vi.fn(),
}));

describe('useTimeslots hook', () => {
  const apiFetchMock = vi.fn();
  const useApiClientMock = vi.mocked(useApiClient);

  beforeEach(() => {
    vi.clearAllMocks();

    // дефолт: успешный ответ пустым массивом
    apiFetchMock.mockResolvedValue([]);
    useApiClientMock.mockReturnValue({ apiFetch: apiFetchMock } as never);
  });

  it('should initialize with default values when roomId is null', () => {
    const { result } = renderHook(() => useTimeslots(null, ''));

    expect(result.current.timeSlots).toEqual([]);
    expect(result.current.timeslotsLoading).toBe(false);
    expect(result.current.timeslotsError).toBeNull();

    // при roomId null хук вообще не должен дергать apiFetch
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('should not fetch timeslots when roomId is null (even if date provided)', () => {
    const { result } = renderHook(() => useTimeslots(null, '2023-01-01'));

    expect(result.current.timeSlots).toEqual([]);
    expect(result.current.timeslotsError).toBeNull();
    expect(result.current.timeslotsLoading).toBe(false);

    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('should fetch timeslots when roomId is provided and date is provided', async () => {
    const mockTimeslots: Timeslot[] = [
      {
        id: 1,
        room_id: 1,
        start_datetime: '2023-01-01T10:00:00Z',
        end_datetime: '2023-01-01T11:00:00Z',
        base_price: '50.00',
        status: 'AVAILABLE',
        has_active_booking: true, // важно: только такие берутся в активные
      },
    ];

    apiFetchMock.mockResolvedValueOnce(mockTimeslots);

    const { result } = renderHook(() => useTimeslots(1, '2023-01-01'));

    // сначала будет loading=true, затем false
    await waitFor(() => expect(result.current.timeslotsLoading).toBe(false));

    expect(result.current.timeslotsError).toBeNull();
    expect(result.current.timeSlots).toEqual([[10, 11]]);

    // проверяем, что дернули корректный endpoint
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = apiFetchMock.mock.calls[0];

    expect(url).toMatch(/^\/rooms\/1\/timeslots\?date_from=.*&date_to=.*/);
    expect(options).toEqual(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('should fetch timeslots when roomId is provided and date is empty (fallback to today)', async () => {
    const mockTimeslots: Timeslot[] = [
      {
        id: 1,
        room_id: 1,
        start_datetime: '2023-01-01T09:00:00Z',
        end_datetime: '2023-01-01T10:00:00Z',
        base_price: '50.00',
        status: 'AVAILABLE',
        has_active_booking: true,
      },
    ];

    apiFetchMock.mockResolvedValueOnce(mockTimeslots);

    const { result } = renderHook(() => useTimeslots(1, ''));

    await waitFor(() => expect(result.current.timeslotsLoading).toBe(false));

    expect(result.current.timeslotsError).toBeNull();
    expect(result.current.timeSlots).toEqual([[9, 10]]);

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    const [url] = apiFetchMock.mock.calls[0];
    expect(url).toMatch(/^\/rooms\/1\/timeslots\?date_from=.*&date_to=.*/);
  });

  it('should handle fetch error', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('Failed to fetch timeslots'));

    const { result } = renderHook(() => useTimeslots(1, '2023-01-01'));

    await waitFor(() => expect(result.current.timeslotsLoading).toBe(false));

    expect(result.current.timeSlots).toEqual([]);
    expect(result.current.timeslotsError).toBe('Failed to fetch timeslots');
  });

  it('should handle AbortError correctly', async () => {
    apiFetchMock.mockRejectedValueOnce(
      new DOMException('AbortError', 'AbortError'),
    );

    const { result } = renderHook(() => useTimeslots(1, '2023-01-01'));

    await waitFor(() => expect(result.current.timeslotsLoading).toBe(false));

    expect(result.current.timeSlots).toEqual([]);
    expect(result.current.timeslotsError).toBeNull();
  });

  it('should filter out non-active bookings or non-AVAILABLE timeslots', async () => {
    const mockTimeslots: Timeslot[] = [
      {
        id: 1,
        room_id: 1,
        start_datetime: '2023-01-01T10:00:00Z',
        end_datetime: '2023-01-01T11:00:00Z',
        base_price: '50.00',
        status: 'AVAILABLE',
        has_active_booking: false, // будет отфильтровано
      },
      {
        id: 2,
        room_id: 1,
        start_datetime: '2023-01-01T12:00:00Z',
        end_datetime: '2023-01-01T13:00:00Z',
        base_price: '60.00',
        status: 'BLOCKED', // будет отфильтровано
        has_active_booking: true,
      },
    ];

    apiFetchMock.mockResolvedValueOnce(mockTimeslots);

    const { result } = renderHook(() => useTimeslots(1, '2023-01-01'));

    await waitFor(() => expect(result.current.timeslotsLoading).toBe(false));

    expect(result.current.timeSlots).toEqual([]); // всё отфильтровалось
    expect(result.current.timeslotsError).toBeNull();
  });
});
