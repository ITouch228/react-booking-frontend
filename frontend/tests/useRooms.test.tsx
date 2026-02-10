import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApiClient } from '../src/services/apiClient';
import useRooms from '../src/hooks/useRooms';
import { buildQuery } from '../src/utils/utils';

vi.mock('../src/services/apiClient', () => ({
  useApiClient: vi.fn(),
}));

vi.mock('../src/utils/utils', () => ({
  buildQuery: vi.fn(),
}));

describe('useRooms hook', () => {
  const apiFetchMock = vi.fn();
  const useApiClientMock = vi.mocked(useApiClient);
  const buildQueryMock = vi.mocked(buildQuery);

  beforeEach(() => {
    vi.clearAllMocks();

    // По умолчанию возвращаем пустой список комнат
    apiFetchMock.mockResolvedValue([]);
    useApiClientMock.mockReturnValue({ apiFetch: apiFetchMock } as never);
    buildQueryMock.mockReturnValue('');
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

    // Проверяем, что buildQuery вызвался с правильными фильтрами
    expect(buildQueryMock).toHaveBeenCalledWith(filters);

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

    buildQueryMock.mockReturnValue(
      'location_id=1&name=Test%20Room&capacity=10&type=MEETING_ROOM&page=0&limit=12',
    );

    const mockRooms = [
      { id: 1, name: 'Test Room 1', capacity: 10, type: 'MEETING' as const },
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
    expect(buildQueryMock).toHaveBeenCalledWith(filters);

    // Проверяем, что apiFetch вызвался с правильным URL
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/rooms?location_id=1&name=Test%20Room&capacity=10&type=MEETING_ROOM&page=0&limit=12',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
      { auth: false },
    );
  });
});
