import { memo, useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiClient } from '../api/apiClient';
import { useRoom } from '../hooks/useRoom';
import TimeSlotSlider from '../components/TimeSlotSlider';
import Spinner from '../components/Spinner';
import type { Draft, Room } from '../types';

type BookingPageProps = {
  rooms: Room[];
  roomsLoading: boolean;
  roomsError: string | null;
  timeslots: [number, number][];
  timeslotsLoading: boolean;
  timeslotsError: string | null;
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
};

const isValidDateInput = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

const BookingPage = memo(function BookingPage({
  rooms,
  roomsLoading,
  roomsError,
  timeslots,
  timeslotsLoading,
  timeslotsError,
  draft,
  setDraft,
}: BookingPageProps) {
  const navigate = useNavigate();
  const { apiFetch } = useApiClient();

  const { room } = useRoom(draft.roomId);

  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [dateInput, setDateInput] = useState(draft.date);
  const [pricePending, setPricePending] = useState(false);
  const [bookingPriceLoading, setBookingPriceLoading] = useState(false);
  const [bookingPriceError, setBookingPriceError] = useState<string | null>(
    null,
  );

  // debounce на дату
  useEffect(() => {
    if (!dateInput || !isValidDateInput(dateInput)) return;

    const id = setTimeout(() => {
      setDraft(d => {
        if (d.date === dateInput) return d;
        return { ...d, date: dateInput };
      });
    }, 300);

    return () => clearTimeout(id);
  }, [dateInput, setDraft]);

  // обновление цены при изменении отрезка времени
  useEffect(() => {
    if (!draft.roomId || !draft.timeFrom || !draft.timeTo) return;

    let cancelled = false;

    const controller = new AbortController();

    const uploadPrice = async () => {
      try {
        setBookingPriceLoading(true);
        setBookingPriceError(null);

        const data = await apiFetch<{ price: string }>(
          `/rooms/${draft.roomId}/price-quote`,
          {
            method: 'POST',
            body: JSON.stringify({
              date_from: draft.timeFrom,
              date_to: draft.timeTo,
            }),
            signal: controller.signal,
          },
        );

        if (cancelled) return;
        if (controller.signal.aborted) return;

        setDraft(d => ({ ...d, basePrice: data.price }));
        setPricePending(false);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;

        const message =
          err instanceof Error
            ? err.message
            : 'Не удалось рассчитать стоимость';
        setBookingPriceError(message);
        setDraft(d => ({ ...d, basePrice: '' }));
        setPricePending(false);
      } finally {
        if (!cancelled && !controller.signal.aborted)
          setBookingPriceLoading(false);
      }
    };

    uploadPrice();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [draft.roomId, draft.timeFrom, draft.timeTo, setDraft, apiFetch]);

  // вычисление timeFrom и timeTo из time в draft
  useEffect(() => {
    if (!draft.time) return;
    if (!draft.date || !/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return;

    const draftTimes = draft.time?.split('-');
    const hours = draftTimes?.map(draftTime => Number(draftTime.split(':')[0]));
    const minutes = draftTimes?.map(draftTime =>
      Number(draftTime.split(':')[1]),
    );

    const timeFrom = new Date(draft.date);
    timeFrom.setHours(hours ? hours[0] : 0, minutes ? minutes[0] : 0, 0, 0);

    const timeTo = new Date(draft.date);
    timeTo.setHours(hours ? hours[1] : 0, minutes ? minutes[1] : 0, 0, 0);

    setDraft(d => {
      const same =
        d.timeFrom?.getTime?.() === timeFrom.getTime() &&
        d.timeTo?.getTime?.() === timeTo.getTime();

      return same ? d : { ...d, timeFrom, timeTo };
    });
  }, [setDraft, draft.time, draft.date]);

  // установка времени в draft
  const handleTimeRangeChange = useCallback(
    (update: React.SetStateAction<Draft>) => {
      setDraft(prev => {
        const next = typeof update === 'function' ? update(prev) : update;

        if (next.time === prev.time && next.hours === prev.hours) {
          return prev;
        }

        setPricePending(true);
        return next;
      });
    },
    [setDraft],
  );

  return (
    <div className='stack-lg'>
      <div>
        <h1 className='page-title'>Бронирование</h1>
        <p className='page-subtitle'>
          Выбор объекта, даты и слота. Слоты показаны карточками.
        </p>
      </div>

      <div className='booking-layout'>
        <section className='card pad' aria-label='Параметры бронирования'>
          <h2 className='card-title'>Параметры</h2>

          <form className='form' onSubmit={e => e.preventDefault()}>
            {roomsLoading ? (
              <div className='card pad' aria-label='Загрузка объектов'>
                <Spinner />
                <div className='hint' style={{ marginTop: 12 }}>
                  Загружаем список объектов…
                </div>
              </div>
            ) : roomsError ? (
              <div className='card pad' aria-label='Ошибка загрузки'>
                <h3 className='card-title'>Не удалось загрузить объекты</h3>
                {/* <p className='card-meta'>{roomsError}</p> */}
              </div>
            ) : (
              <div className='field'>
                <label htmlFor='bk-resource'>Объект</label>
                <select
                  id='bk-resource'
                  className='control'
                  value={draft.roomId}
                  onChange={e => {
                    setDraft((d: Draft) => ({
                      ...d,
                      roomId: Number(e.target.value),
                    }));
                  }}
                >
                  {rooms.map((r: Room) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.hour_price} ₽/ч
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className='field'>
              <label htmlFor='bk-date'>Дата</label>
              <input
                id='bk-date'
                className='control'
                type='date'
                value={dateInput}
                onChange={e => setDateInput(e.target.value)}
              />
            </div>

            <div className='field'>
              <label htmlFor='bk-notes'>Комментарий (необязательно)</label>
              <textarea
                id='bk-notes'
                className='control'
                rows={3}
                style={{ resize: 'none' }}
                placeholder='Например: нужен HDMI-кабель или тихая зона'
              ></textarea>
            </div>
          </form>
        </section>

        <section className='stack' aria-label='Доступные слоты'>
          <div className='card pad'>
            <div className='card-header'>
              <div>
                <h2 className='card-title'>Слоты на {draft.date}</h2>
                <p className='card-meta'>{room?.name}</p>
              </div>
              <span className='badge'>
                <i className='fa-solid fa-bolt' aria-hidden='true'></i>
                Минимум: {room?.booking_step_minutes || 60} минут
              </span>
            </div>

            {roomsLoading || (timeslotsLoading && timeslots.length === 0) ? (
              <div className='card pad' aria-label='Загрузка объектов'>
                <Spinner />
                <div className='hint' style={{ marginTop: 12 }}>
                  Загружаем доступные таймслоты…
                </div>
              </div>
            ) : timeslotsError && timeslots.length === 0 ? (
              <div className='card pad' aria-label='Ошибка загрузки'>
                <h3 className='card-title'>Не удалось загрузить слоты</h3>
                {/* <p className='card-meta'>{timeslotsError}</p> */}
              </div>
            ) : null}
            {!roomsLoading &&
            !roomsError &&
            !timeslotsLoading &&
            !timeslotsError ? (
              <TimeSlotSlider
                selectedTime={draft.time ?? '00:00-01:00'}
                notAllowedTime={timeslots}
                onTimeRangeChange={handleTimeRangeChange}
                onDraggingChange={setIsSliderDragging}
                stepMinutes={room?.booking_step_minutes}
              />
            ) : null}
          </div>

          <div className='sticky-actions' aria-label='Итог'>
            <div className='card'>
              <div className='summary'>
                <div className='summary-row'>
                  <span>Объект</span>
                  <strong>{room?.name}</strong>
                </div>
                <div className='summary-row'>
                  <span>Дата</span>
                  <strong>{draft.date}</strong>
                </div>
                <div className='summary-row'>
                  <span>Слот</span>
                  <strong className={isSliderDragging ? 'blurred' : ''}>
                    {draft.time ? draft.time : 'Не выбран'}
                  </strong>
                </div>
                <div className='summary-row'>
                  <span>Стоимость</span>
                  {bookingPriceError ? (
                    <strong
                      className={
                        isSliderDragging || bookingPriceLoading || pricePending
                          ? 'blurred'
                          : ''
                      }
                    >
                      Ошибка, повторите позже
                    </strong>
                  ) : (
                    <strong
                      className={
                        isSliderDragging || bookingPriceLoading || pricePending
                          ? 'blurred'
                          : ''
                      }
                    >
                      {draft.time ? <>{draft.basePrice} ₽</> : '—'}
                    </strong>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button
                  className={`btn btn-primary btn-block ${
                    !draft.time ||
                    !draft.hours ||
                    draft.hours <
                      (room?.min_booking_duration_minutes ?? 60) / 60
                      ? 'btn-disabled'
                      : ''
                  }`}
                  type='button'
                  disabled={
                    !draft.time ||
                    !draft.hours ||
                    draft.hours <
                      (room?.min_booking_duration_minutes ?? 60) / 60
                  }
                  onClick={() => navigate('/confirmation')}
                  aria-disabled={
                    !draft.time ||
                    !draft.hours ||
                    draft.hours <
                      (room?.min_booking_duration_minutes ?? 60) / 60
                  }
                  title={
                    !draft.time ||
                    !draft.hours ||
                    draft.hours <
                      (room?.min_booking_duration_minutes ?? 60) / 60
                      ? `Слот минимум на ${
                          room?.booking_step_minutes || 60
                        } минут`
                      : ''
                  }
                >
                  <i className='fa-solid fa-check' aria-hidden='true'></i>
                  Перейти к подтверждению
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
});

export default BookingPage;
