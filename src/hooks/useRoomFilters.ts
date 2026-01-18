import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseBoolOrUndefined, parseIntOrUndefined } from '../utils/utils';
import type { RoomType, RoomFilters } from '../types';

const DEFAULT_LIMIT = 12;

function useRoomFilters() {
  const [sp, setSp] = useSearchParams();
  const didInitRef = useRef(false);

  // сброс page при перезагрузке
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const page = sp.get('page');
    if (page && page !== '0') {
      const next = new URLSearchParams(sp);
      next.set('page', '0');
      setSp(next, { replace: true });
    }
  }, [sp, setSp]);

  const filters: RoomFilters = useMemo(() => {
    const page = parseIntOrUndefined(sp.get('page')) ?? 0;
    const limit = parseIntOrUndefined(sp.get('limit')) ?? DEFAULT_LIMIT;

    return {
      page,
      limit,
      location_id: parseIntOrUndefined(sp.get('location_id')),
      name: sp.get('name') || undefined,
      capacity: parseIntOrUndefined(sp.get('capacity')),
      description: sp.get('description') || undefined,
      type: (sp.get('type') as RoomType | null) || undefined,
      time_slot_type: sp.get('time_slot_type') || undefined,
      min_booking_duration_minutes: parseIntOrUndefined(
        sp.get('min_booking_duration_minutes'),
      ),
      booking_step_minutes: parseIntOrUndefined(sp.get('booking_step_minutes')),
      hour_price: parseIntOrUndefined(sp.get('hour_price')),
      is_active: parseBoolOrUndefined(sp.get('is_active')),
    };
  }, [sp]);

  // Сеттер с проверкой на наличие изменений
  const setFilter = useCallback(
    <K extends keyof RoomFilters>(key: K, value: RoomFilters[K]) => {
      const current = sp.get(String(key));

      const normalized =
        value === undefined || value === null || value === ''
          ? null
          : String(value);

      // Ничего не меняем — значит не сбрасываем page и не делаем replace
      if (current === normalized) return;
      if (current === null && normalized === null) return;

      const next = new URLSearchParams(sp);

      // Любое РЕАЛЬНОЕ изменение фильтра должно сбрасывать страницу
      if (key !== 'page') next.set('page', '0');

      if (normalized === null) next.delete(String(key));
      else next.set(String(key), normalized);

      setSp(next, { replace: true });
    },
    [sp, setSp],
  );

  const patchFilters = useCallback(
    (patch: Partial<RoomFilters>) => {
      const next = new URLSearchParams(sp);

      // Любое изменение фильтра (кроме page) сбрасывает page
      const changesKeys = Object.keys(patch) as (keyof RoomFilters)[];
      const hasNonPageChange = changesKeys.some(
        k => k !== 'page' && k !== 'limit',
      );
      if (hasNonPageChange) next.set('page', '0');

      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || v === '') next.delete(k);
        else next.set(k, String(v));
      }

      setSp(next, { replace: true });
    },
    [sp, setSp],
  );

  // сброс фильтров
  const resetFilters = useCallback(() => {
    const next = new URLSearchParams();
    next.set('page', '0');
    next.set('limit', String(DEFAULT_LIMIT));
    setSp(next, { replace: true });
  }, [setSp]);

  // сдвиг страницы на 1
  const nextPage = useCallback(() => {
    console.log(`Next Page`);
    const next = new URLSearchParams(sp);
    const current = parseIntOrUndefined(sp.get('page')) ?? 0;
    next.set('page', String(current + 1));
    setSp(next, { replace: true });
  }, [sp, setSp]);

  return { filters, setFilter, patchFilters, resetFilters, nextPage };
}

export default useRoomFilters;
