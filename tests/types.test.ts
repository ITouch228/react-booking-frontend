import { describe, it, expect } from 'vitest';
import { ROOM_TYPE_LABELS, ROOM_TYPES, FALLBACK_IMG } from '../src/types';

describe('Type definitions and constants', () => {
  describe('ROOM_TYPES', () => {
    it('should contain all expected room types', () => {
      const expectedRoomTypes = [
        'MEETING_ROOM',
        'COWORK_DESK',
        'STUDIO',
        'SPORT',
      ];
      expect(ROOM_TYPES).toEqual(expectedRoomTypes);
    });

    it('should have the correct number of room types', () => {
      expect(ROOM_TYPES.length).toBe(4);
    });
  });

  describe('ROOM_TYPE_LABELS', () => {
    it('should return correct labels for each room type', () => {
      expect(ROOM_TYPE_LABELS('MEETING_ROOM')).toBe('Переговорная');
      expect(ROOM_TYPE_LABELS('COWORK_DESK')).toBe('Рабочее место');
      expect(ROOM_TYPE_LABELS('STUDIO')).toBe('Студия');
      expect(ROOM_TYPE_LABELS('SPORT')).toBe('Спорт');
    });

    it('should return "Комната" for null or undefined room type', () => {
      expect(ROOM_TYPE_LABELS(null)).toBe('Комната');
      // @ts-expect-error Testing undefined input
      expect(ROOM_TYPE_LABELS(undefined)).toBe('Комната');
    });
  });

  describe('FALLBACK_IMG', () => {
    it('should have the correct fallback image path', () => {
      expect(FALLBACK_IMG).toBe('/assets/space-meeting.svg');
    });
  });
});
