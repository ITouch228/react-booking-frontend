import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useBookings from '../src/hooks/useBookings';
import { AuthContext } from '../src/hooks/authContext';
import { useApiClient } from '../src/services/apiClient';
import type { Booking, AuthContextType } from '../src/types';

vi.mock('../src/services/apiClient', () => ({
  useApiClient: vi.fn(),
}));

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const mockAuthContext: AuthContextType = {
    user: { username: 'testuser', email: 'test@example.com', role: 'USER' },
    accessToken: 'mock-token',
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    setAccessToken: vi.fn(),
  };

  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};

describe('useBookings hook', () => {
  const apiFetchMock = vi.fn();
  const useApiClientMock = vi.mocked(useApiClient);

  beforeEach(() => {
    vi.clearAllMocks();
    apiFetchMock.mockResolvedValue([]);
    useApiClientMock.mockReturnValue({ apiFetch: apiFetchMock });
  });

  it('should initialize with loading=true and empty data', () => {
    const { result } = renderHook(() => useBookings(), {
      wrapper: MockAuthProvider,
    });

    expect(result.current.bookings).toEqual([]);
    expect(result.current.bookingsLoading).toBe(true);
    expect(result.current.bookingsError).toBeNull();
  });

  it('should fetch bookings on mount', async () => {
    const mockBookings: Booking[] = [
      {
        booking: {
          id: 1,
          user_id: 1,
          room_id: 1,
          timeslot_id: 1,
          status: 'PAID',
          total_price: '100.00',
        },
        timeslot: {
          id: 1,
          room_id: 1,
          start_datetime: '2023-01-01T10:00Z',
          end_datetime: '2023-01-01T11:00Z',
          base_price: 10,
          status: 'AVAILABLE',
        },
      },
    ];

    apiFetchMock.mockResolvedValueOnce(mockBookings);

    const { result } = renderHook(() => useBookings(), {
      wrapper: MockAuthProvider,
    });

    await waitFor(() => {
      expect(result.current.bookingsLoading).toBe(false);
    });

    expect(result.current.bookings).toEqual(mockBookings);
    expect(result.current.bookingsError).toBeNull();
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch error', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('Failed to fetch bookings'));

    const { result } = renderHook(() => useBookings(), {
      wrapper: MockAuthProvider,
    });

    await waitFor(() => {
      expect(result.current.bookingsLoading).toBe(false);
    });

    expect(result.current.bookings).toEqual([]);
    expect(result.current.bookingsError).toBe('Failed to fetch bookings');
  });

  it('should ignore AbortError', async () => {
    apiFetchMock.mockRejectedValueOnce(
      new DOMException('Aborted', 'AbortError'),
    );

    const { result } = renderHook(() => useBookings(), {
      wrapper: MockAuthProvider,
    });

    await waitFor(() => {
      expect(result.current.bookingsLoading).toBe(false);
    });

    expect(result.current.bookings).toEqual([]);
    expect(result.current.bookingsError).toBeNull();
  });
});
