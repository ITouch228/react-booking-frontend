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

    // По умолчанию возвращаем пустой список комнат
    apiFetchMock.mockResolvedValue([]);
    useApiClientMock.mockReturnValue({ apiFetch: apiFetchMock } as never);
    buildRoomsQueryMock.mockReturnValue(new URLSearchParams());
  });

  it('should initialize and then finish with empty rooms', async () => {
    const filters = { page: 0, limit: 12 };
    const { result } = renderHook(() => useRooms(filters));

    // Сразу после mount хук должен стартовать загрузку
    expect(result.current.rooms).toEqual([]);
    expect(result.current.roomsLoading).toBe(true);
    expect(result.current.roomsError).toBeNull();

    // После завершения запроса загрузка должна закончиться
    await waitFor(() => expect(result.current.roomsLoading).toBe(false));

    // Итоговое состояние
    expect(result.current.rooms).toEqual([]);
    expect(result.current.roomsError).toBeNull();

    // Проверяем, что buildRoomsQuery вызвался с правильными фильтрами
    expect(buildRoomsQueryMock).toHaveBeenCalledWith(filters);

    // Опционально: проверяем, что apiFetch вызвался корректно
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/rooms?',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
      { auth: false },
    );
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

    buildRoomsQueryMock.mockReturnValue(
      new URLSearchParams(
        'location_id=1&name=Test%20Room&capacity=10&type=MEETING_ROOM&page=0&limit=12',
      ),
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

    // Проверяем начальное состояние
    expect(result.current.rooms).toEqual([]);
    expect(result.current.roomsLoading).toBe(true);
    expect(result.current.roomsError).toBeNull();

    // Ждем завершения загрузки
    await waitFor(() => expect(result.current.roomsLoading).toBe(false));

    // Проверяем результат
    expect(result.current.rooms).toEqual(mockRooms);
    expect(result.current.roomsError).toBeNull();

    // Проверяем, что buildQuery вызвался с правильными фильтрами
    expect(buildRoomsQueryMock).toHaveBeenCalledWith(filters);

    // Проверяем, что apiFetch вызвался с правильным URL
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/rooms?location_id=1&name=Test%20Room&capacity=10&type=MEETING_ROOM&page=0&limit=12',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
      { auth: false },
    );
  });
});
