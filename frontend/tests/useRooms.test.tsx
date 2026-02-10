import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApiClient } from '../src/api/apiClient';
import useRooms from '../src/hooks/useRooms';
import { buildRoomsQuery } from '../src/utils/utils';

vi.mock('../src/api/apiClient', () => ({
  useApiClient: vi.fn(),
}));

vi.mock('../src/utils/utils', () => ({
  buildRoomsQuery: vi.fn(),
}));

describe('useRooms hook', () => {
  const apiFetchMock = vi.fn();
  const useApiClientMock = vi.mocked(useApiClient);
  const buildRoomsQueryMock = vi.mocked(buildRoomsQuery);

  beforeEach(() => {
    vi.clearAllMocks();

    apiFetchMock.mockResolvedValue([]);
    useApiClientMock.mockReturnValue({ apiFetch: apiFetchMock } as never);
    buildRoomsQueryMock.mockReturnValue(new URLSearchParams());
  });

  it('should initialize and then finish with empty rooms', async () => {
    const filters = { page: 0, limit: 12 };
    const { result } = renderHook(() => useRooms(filters));

    // initial
    expect(result.current.rooms).toEqual([]);
    expect(result.current.roomsLoading).toBe(true);
    expect(result.current.roomsError).toBeNull();

    await waitFor(() => expect(result.current.roomsLoading).toBe(false));

    // final
    expect(result.current.rooms).toEqual([]);
    expect(result.current.roomsError).toBeNull();

    expect(buildRoomsQueryMock).toHaveBeenCalledWith(filters);

    // apiFetch called
    expect(apiFetchMock).toHaveBeenCalledTimes(1);

    const [url, opts, meta] = apiFetchMock.mock.calls[0];

    expect(url).toBe('/rooms?'); // пустые параметры дают просто "/rooms?"
    expect(opts).toEqual(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(meta).toEqual({ auth: false });
  });

  it('should fetch rooms with filters applied', async () => {
    const filters = {
      page: 0,
      limit: 12,
      location_id: 1,
      name: 'Test Room',
      capacity: 10,
      type: 'MEETING_ROOM' as const,
    };

    // ВАЖНО: URLSearchParams сам решит, как кодировать пробел (обычно '+')
    buildRoomsQueryMock.mockReturnValue(
      new URLSearchParams({
        location_id: '1',
        name: 'Test Room',
        capacity: '10',
        type: 'MEETING_ROOM',
        page: '0',
        limit: '12',
      }),
    );

    const mockRooms = [
      {
        id: 1,
        name: 'Test Room 1',
        type: 'MEETING_ROOM',
        capacity: 10,
        description: 'A test meeting room',
        hour_price: '50.00',
        images: [],
        features: [],
        time_slot_type: 'FLEXIBLE',
        location: {
          id: 1,
          name: 'Test Location',
          address: 'Test Address',
          description: 'Test Description',
          features: [],
        },
        min_booking_duration_minutes: 60,
        booking_step_minutes: 60,
        image_id: 1,
        location_id: 1,
      },
    ];

    apiFetchMock.mockResolvedValue(mockRooms);

    const { result } = renderHook(() => useRooms(filters));

    // initial
    expect(result.current.rooms).toEqual([]);
    expect(result.current.roomsLoading).toBe(true);
    expect(result.current.roomsError).toBeNull();

    await waitFor(() => expect(result.current.roomsLoading).toBe(false));

    // final
    expect(result.current.rooms).toEqual(mockRooms);
    expect(result.current.roomsError).toBeNull();

    expect(buildRoomsQueryMock).toHaveBeenCalledWith(filters);

    // apiFetch called
    expect(apiFetchMock).toHaveBeenCalledTimes(1);

    const [url, opts, meta] = apiFetchMock.mock.calls[0];

    // URL должен начинаться с /rooms?
    expect(url).toMatch(/^\/rooms\?/);

    const qs = url.split('?')[1] ?? '';
    const params = new URLSearchParams(qs);

    // проверяем параметры как значения (так не важны '+/%20' и порядок параметров)
    expect(params.get('location_id')).toBe('1');
    expect(params.get('name')).toBe('Test Room');
    expect(params.get('capacity')).toBe('10');
    expect(params.get('type')).toBe('MEETING_ROOM');
    expect(params.get('page')).toBe('0');
    expect(params.get('limit')).toBe('12');

    expect(opts).toEqual(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(meta).toEqual({ auth: false });
  });
});
