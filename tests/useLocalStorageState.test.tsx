import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorageState } from '../src/hooks/useLocalStorageState';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Create a type for localStorage data to help with mocking
type LocalStorageData = {
  [key: string]: string;
};

let localStorageData: LocalStorageData = {};

beforeEach(() => {
  // Reset localStorage mock and data
  localStorageData = {};
  mockLocalStorage.getItem.mockImplementation(
    (key: string) => localStorageData[key] || null,
  );
  mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
    localStorageData[key] = value;
  });
  mockLocalStorage.removeItem.mockImplementation((key: string) => {
    delete localStorageData[key];
  });

  // Mock window.localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useLocalStorageState', () => {
  it('should initialize with the initial value when no item exists in localStorage', () => {
    const initialValue = 'default';
    const key = 'testKey';

    const { result } = renderHook(() =>
      useLocalStorageState(key, initialValue),
    );

    expect(result.current[0]).toEqual(initialValue);
  });

  it('should initialize with the value from localStorage if it exists', () => {
    const storedValue = 'stored';
    const key = 'testKey';

    // Pre-populate localStorage
    localStorageData[key] = JSON.stringify(storedValue);

    const { result } = renderHook(() => useLocalStorageState(key, 'default'));

    expect(result.current[0]).toEqual(storedValue);
  });

  it('should handle JSON parsing errors gracefully', () => {
    const key = 'testKey';

    // Set invalid JSON in localStorage
    localStorageData[key] = 'invalid-json';

    const { result } = renderHook(() => useLocalStorageState(key, 'default'));

    expect(result.current[0]).toEqual('default');
  });

  it('should update localStorage when the state changes', () => {
    const key = 'testKey';
    const initialValue = 'initial';

    const { result } = renderHook(() =>
      useLocalStorageState(key, initialValue),
    );

    // Update the state
    const newValue = 'updated';
    act(() => {
      result.current[1](newValue);
    });

    expect(result.current[0]).toEqual(newValue);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      key,
      JSON.stringify(newValue),
    );
  });

  it('should update state with a function updater', () => {
    const key = 'testKey';
    const initialValue = 'initial';

    const { result } = renderHook(() =>
      useLocalStorageState(key, initialValue),
    );

    // Update the state using a function
    act(() => {
      result.current[1](prev => `${prev}-updated`);
    });

    expect(result.current[0]).toEqual('initial-updated');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      key,
      JSON.stringify('initial-updated'),
    );
  });

  it('should handle localStorage.setItem errors gracefully', () => {
    const key = 'testKey';
    const initialValue = 'initial';

    // Mock setItem to throw an error
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() =>
      useLocalStorageState(key, initialValue),
    );

    // Update the state - this should not throw an error
    const newValue = 'updated';
    expect(() => {
      act(() => {
        result.current[1](newValue);
      });
    }).not.toThrow();

    // State should still update even if localStorage fails
    expect(result.current[0]).toEqual(newValue);
  });

  it('should work with complex data types', () => {
    const key = 'testKey';
    const initialValue = { name: 'John', age: 30 };

    const { result } = renderHook(() =>
      useLocalStorageState(key, initialValue),
    );

    // Update the state with a new object
    const newValue = { name: 'Jane', age: 25 };
    act(() => {
      result.current[1](newValue);
    });

    expect(result.current[0]).toEqual(newValue);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      key,
      JSON.stringify(newValue),
    );
  });
});
