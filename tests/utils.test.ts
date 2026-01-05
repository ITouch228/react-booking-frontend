import { describe, it, expect } from 'vitest';
import { cx, convertNumericToTime } from '../src/utils/utils';

describe('Utility functions', () => {
  describe('cx', () => {
    it('should join class names correctly', () => {
      const result = cx(
        'class1',
        'class2',
        false,
        null,
        undefined,
        0,
        'class3',
      );
      expect(result).toBe('class1 class2 class3');
    });

    it('should return empty string when all falsy values are passed', () => {
      const result = cx(false, null, undefined, 0, '');
      expect(result).toBe('');
    });

    it('should handle single class name', () => {
      const result = cx('singleClass');
      expect(result).toBe('singleClass');
    });
  });

  describe('convertNumericToTime', () => {
    it('should convert numeric value to time format', () => {
      expect(convertNumericToTime(9)).toBe('9:00');
      expect(convertNumericToTime(9.5)).toBe('9:30');
      expect(convertNumericToTime(14.25)).toBe('14:15');
      expect(convertNumericToTime(0)).toBe('0:00');
    });

    it('should handle time with leading zero for minutes', () => {
      expect(convertNumericToTime(9.1)).toBe('9:06'); // 0.1 * 60 = 6 minutes
      expect(convertNumericToTime(10.01)).toBe('10:01'); // 0.01 * 60 ≈ 1 minute
    });

    it('should handle whole hours correctly', () => {
      expect(convertNumericToTime(8)).toBe('8:00');
      expect(convertNumericToTime(15)).toBe('15:00');
    });
  });
});
