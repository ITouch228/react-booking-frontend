import { describe, it, expect } from 'vitest';
import {
  buildQuery,
  buildRoomsQuery,
  cx,
  convertNumericToTime,
  parseBoolOrUndefined,
  parseIntOrUndefined,
  parseTimeRangeToHours,
} from '../src/utils/utils';

describe('cx', () => {
  it('joins truthy class names', () => {
    expect(cx('class1', 'class2', false, null, undefined, 0, 'class3')).toBe(
      'class1 class2 class3',
    );
  });

  it('returns empty string when all values are falsy', () => {
    expect(cx(false, null, undefined, 0, '')).toBe('');
  });

  it('handles a single class name', () => {
    expect(cx('singleClass')).toBe('singleClass');
  });
});

describe('convertNumericToTime', () => {
  it('converts decimal hours to "H:MM"', () => {
    expect(convertNumericToTime(9)).toBe('9:00');
    expect(convertNumericToTime(9.5)).toBe('9:30');
    expect(convertNumericToTime(14.25)).toBe('14:15');
    expect(convertNumericToTime(0)).toBe('0:00');
  });

  it('pads single-digit minutes with a leading zero', () => {
    expect(convertNumericToTime(9.1)).toBe('9:06');
    expect(convertNumericToTime(10.01)).toBe('10:01');
  });
});

describe('buildRoomsQuery', () => {
  it('always sets page, limit and time_slot_type=FLEXIBLE', () => {
    const q = buildRoomsQuery({ page: 1, limit: 10 });
    expect(q.get('page')).toBe('1');
    expect(q.get('limit')).toBe('10');
    expect(q.get('time_slot_type')).toBe('FLEXIBLE');
  });

  it('includes only the filters that are set', () => {
    const q = buildRoomsQuery({
      page: 1,
      limit: 10,
      type: 'desk',
      capacity: 4,
    });
    expect(q.get('type')).toBe('desk');
    expect(q.get('capacity')).toBe('4');
    expect(q.has('name')).toBe(false);
    expect(q.has('hour_price')).toBe(false);
  });

  it('passes location_id and is_active through', () => {
    const q = buildRoomsQuery({
      page: 1,
      limit: 10,
      locationId: 7,
      isActive: true,
    });
    expect(q.get('location_id')).toBe('7');
    expect(q.get('is_active')).toBe('true');
  });

  it('keeps numeric zero values (capacity=0)', () => {
    const q = buildRoomsQuery({ page: 1, limit: 10, capacity: 0 });
    expect(q.get('capacity')).toBe('0');
  });
});

describe('buildQuery', () => {
  it('serialises page, limit and hard-coded time_slot_type=FLEXIBLE', () => {
    const q = buildQuery({ page: 2, limit: 20 });
    expect(q).toContain('page=2');
    expect(q).toContain('limit=20');
    expect(q).toContain('timeSlotType=FLEXIBLE');
  });

  it('skips undefined / null / empty-string filters', () => {
    const q = buildQuery({
      page: 1,
      limit: 10,
      name: '',
      type: undefined,
      capacity: null,
    });
    expect(q).not.toContain('name=');
    expect(q).not.toContain('type=');
    expect(q).not.toContain('capacity=');
  });

  it('URL-encodes values', () => {
    const q = buildQuery({ page: 1, limit: 10, name: 'work space' });
    expect(q).toContain('name=work+space');
  });
});

describe('parseIntOrUndefined', () => {
  it('returns undefined for null/empty/non-numeric', () => {
    expect(parseIntOrUndefined(null)).toBeUndefined();
    expect(parseIntOrUndefined('')).toBeUndefined();
    expect(parseIntOrUndefined('  ')).toBeUndefined();
    expect(parseIntOrUndefined('abc')).toBeUndefined();
  });

  it('parses finite numbers', () => {
    expect(parseIntOrUndefined('42')).toBe(42);
    expect(parseIntOrUndefined('-3')).toBe(-3);
  });
});

describe('parseBoolOrUndefined', () => {
  it('parses "true"/"false"', () => {
    expect(parseBoolOrUndefined('true')).toBe(true);
    expect(parseBoolOrUndefined('false')).toBe(false);
  });

  it('returns undefined for anything else', () => {
    expect(parseBoolOrUndefined(null)).toBeUndefined();
    expect(parseBoolOrUndefined('')).toBeUndefined();
    expect(parseBoolOrUndefined('yes')).toBeUndefined();
  });
});

describe('parseTimeRangeToHours', () => {
  it('parses "HH:MM-HH:MM" to decimal hours', () => {
    expect(parseTimeRangeToHours('9:00-18:00')).toEqual([9, 18]);
    expect(parseTimeRangeToHours('9:30-10:15')[0]).toBe(9.5);
    expect(parseTimeRangeToHours('9:30-10:15')[1]).toBeCloseTo(10.25, 5);
  });

  it('throws on invalid range format', () => {
    expect(() => parseTimeRangeToHours('bad')).toThrow(
      /Invalid time range format/,
    );
  });

  it('throws on invalid time value', () => {
    expect(() => parseTimeRangeToHours('25:00-26:00')).toThrow(
      /Invalid time value/,
    );
    expect(() => parseTimeRangeToHours('9:99-10:00')).toThrow(
      /Invalid time value/,
    );
  });
});
