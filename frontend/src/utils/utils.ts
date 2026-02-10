import type { RoomFilters } from '../types';

export const cx = (...parts: Array<string | false | null | undefined | 0>) => {
  return parts.filter(Boolean).join(' ');
};

export const convertNumericToTime = (value: number): string => {
  const hours = Math.floor(value);
  const minutes = Math.round((value % 1) * 60);
  return `${hours}:${minutes < 10 ? `0${minutes}` : minutes}`;
};

export const buildRoomsQuery = (filters: RoomFilters): URLSearchParams => {
  const params = new URLSearchParams();

  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  params.set('time_slot_type', 'FLEXIBLE');

  if (filters.locationId != null)
    params.set('location_id', String(filters.locationId));

  if (filters.name) params.set('name', filters.name);

  if (filters.capacity != null)
    params.set('capacity', String(filters.capacity));

  if (filters.description) params.set('description', filters.description);

  if (filters.type) params.set('type', filters.type);

  // if (filters.timeSlotType) params.set('time_slot_type', filters.timeSlotType);

  if (filters.minBookingDurationMinutes != null)
    params.set(
      'min_booking_duration_minutes',
      String(filters.minBookingDurationMinutes),
    );

  if (filters.bookingStepMinutes != null)
    params.set('booking_step_minutes', String(filters.bookingStepMinutes));

  if (filters.hourPrice != null)
    params.set('hour_price', String(filters.hourPrice));

  if (filters.isActive != null)
    params.set('is_active', String(filters.isActive));

  return params;
};

export const buildQuery = (filters: RoomFilters): string => {
  const params = new URLSearchParams();

  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));

  // остальные поля — только если заданы
  const entries: Array<[keyof RoomFilters, unknown]> = [
    ['locationId', filters.locationId],
    ['name', filters.name],
    ['capacity', filters.capacity],
    ['description', filters.description],
    ['type', filters.type],
    // ['timeSlotType', filters.timeSlotType],
    ['timeSlotType', 'FLEXIBLE'], // Хардкод фильтра только на флексибл таймслоты пока нет реализации с фиксированными
    ['minBookingDurationMinutes', filters.minBookingDurationMinutes],
    ['bookingStepMinutes', filters.bookingStepMinutes],
    ['hourPrice', filters.hourPrice],
    ['isActive', filters.isActive],
  ];

  for (const [k, v] of entries) {
    if (v === undefined || v === null || v === '') continue;
    params.set(String(k), String(v));
  }

  return params.toString();
};

export const parseIntOrUndefined = (v: string | null) => {
  if (v == null || v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const parseBoolOrUndefined = (v: string | null) => {
  if (v == null || v.trim() === '') return undefined;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
};

export const parseTimeRangeToHours = (range: string): [number, number] => {
  const [from, to] = range.split('-');
  if (!from || !to) {
    throw new Error(`Invalid time range format: "${range}"`);
  }

  const toHours = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    if (
      !Number.isFinite(h) ||
      !Number.isFinite(m) ||
      h < 0 ||
      h > 23 ||
      m < 0 ||
      m > 59
    ) {
      throw new Error(`Invalid time value: "${time}"`);
    }
    return h + m / 60;
  };

  return [toHours(from), toHours(to)];
};
