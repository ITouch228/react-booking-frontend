import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useRooms from '../src/hooks/useRooms';
import { useApiClient } from '../src/services/apiClient';

vi.mock('../src/services/apiClient', () => ({
  useApiClient: vi.fn(),
}));

describe('useRooms hook', () => {
  const apiFetchMock = vi.fn();
  const useApiClientMock = vi.mocked(useApiClient);

  beforeEach(() => {
    vi.clearAllMocks();

    // По умолчанию возвращаем пустой список комнат
    apiFetchMock.mockResolvedValue([]);
    useApiClientMock.mockReturnValue({ apiFetch: apiFetchMock } as never);
  });

  it('should initialize and then finish with empty rooms', async () => {
    const { result } = renderHook(() => useRooms());

    // Сразу после mount хук должен стартовать загрузку
    expect(result.current.rooms).toEqual([]);
    expect(result.current.roomsLoading).toBe(true);
    expect(result.current.roomsError).toBeNull();

    // После завершения запроса загрузка должна закончиться
    await waitFor(() => expect(result.current.roomsLoading).toBe(false));

    // Итоговое состояние
    expect(result.current.rooms).toEqual([]);
    expect(result.current.roomsError).toBeNull();

    // Опционально: проверяем, что apiFetch вызвался корректно
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/rooms',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
      { auth: false },
    );
  });
});
