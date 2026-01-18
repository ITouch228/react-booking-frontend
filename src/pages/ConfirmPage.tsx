import { memo, useCallback, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiClient } from '../services/apiClient';
import { useRoom } from '../hooks/useRoom';
import { cx } from '../utils/utils';
import { toast } from 'react-toastify';
import type { Booking, Draft } from '../types';

type ConfirmationPageProps = {
  draft: Draft;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
};

const ConfirmationPage = memo(function ConfirmationPage({
  draft,
  bookings,
  setBookings,
}: ConfirmationPageProps) {
  const navigate = useNavigate();

  const { apiFetch } = useApiClient();
  const { room } = useRoom(draft.roomId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // флаг возможности для бронирования
  const canConfirm = useMemo(
    () => Boolean(room && draft.time && draft.date),
    [room, draft.time, draft.date],
  );

  // создание бронирования
  const handleConfirm = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!canConfirm) return;

      try {
        setIsLoading(true);
        setError(null);
        const booking = await apiFetch<Booking>('/bookings/flexible', {
          method: 'POST',
          body: JSON.stringify({
            room_id: draft.roomId,
            start_datetime: draft.timeFrom,
            end_datetime: draft.timeTo,
          }),
        });
        setBookings([booking, ...bookings]);

        navigate('/profile');
      } catch (err) {
        setIsLoading(false);

        if (err instanceof Error) {
          const message = err.message;

          if (message.includes('Сессия истекла, авторизуйтесь заново')) {
            toast.warning('Сессия истекла, авторизуйтесь заново');
            navigate('/login?next=/confirmation');
          } else {
            setError(message);
          }
        }
      }
    },
    [
      apiFetch,
      bookings,
      draft.roomId,
      draft.timeFrom,
      draft.timeTo,
      navigate,
      canConfirm,
      setBookings,
    ],
  );

  return (
    <div className='stack-lg'>
      <div>
        <h1 className='page-title'>Подтверждение</h1>
        <p className='page-subtitle'>
          Сводка выбранных данных, структура, кнопка подтверждения внизу.
        </p>
      </div>

      {error && (
        <div className='error-message'>
          <p>{error}</p>
        </div>
      )}

      <div className='confirm-layout'>
        <section className='card pad' aria-label='Детали бронирования'>
          <div className='card-header'>
            <div>
              <h2 className='card-title'>Детали</h2>
              <p className='card-meta'>
                Проверьте параметры перед подтверждением.
              </p>
            </div>
            <span className={cx('badge', canConfirm ? 'ok' : 'warn')}>
              <i
                className={cx(
                  'fa-solid',
                  canConfirm ? 'fa-circle-check' : 'fa-triangle-exclamation',
                )}
                aria-hidden='true'
              ></i>{' '}
              {canConfirm ? 'Готово' : 'Требует выбора'}
            </span>
          </div>

          <div className='stack' style={{ marginTop: 12 }}>
            <div className='alert info'>
              <i className='fa-solid fa-location-dot' aria-hidden='true'></i>
              <div>
                <h3>Объект</h3>
                <p>
                  <strong>{room?.name || '—'}</strong>
                  <br />
                  {room?.location.name || ''}
                </p>
              </div>
            </div>

            <div className='alert info'>
              <i className='fa-solid fa-calendar-day' aria-hidden='true'></i>
              <div>
                <h3>Дата</h3>
                <p>{draft.date || '—'}</p>
              </div>
            </div>

            <div className='alert info'>
              <i className='fa-solid fa-clock' aria-hidden='true'></i>
              <div>
                <h3>Время</h3>
                <p>{draft.time ? draft.time : 'Слот не выбран'}</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              className='btn btn-ghost'
              type='button'
              onClick={() => navigate('/booking')}
            >
              <i className='fa-solid fa-pen-to-square' aria-hidden='true'></i>
              Изменить выбор
            </button>
          </div>
        </section>

        <aside className='sticky-actions' aria-label='Итоговая стоимость'>
          <div className='card'>
            <h2 className='card-title'>Итого</h2>
            <p className='card-meta'>Расчет стоимости</p>

            <div className='summary' style={{ marginTop: 12 }}>
              <div className='summary-row'>
                <span>Цена за час</span>
                <strong>{room ? <span>{room.hour_price} ₽</span> : '—'}</strong>
              </div>
              <div className='summary-row'>
                <span>Длительность</span>
                <strong>{draft.hours ? `${draft.hours} ч` : '—'}</strong>
              </div>
              <div className='summary-row'>
                <span>Сервисный сбор</span>
                <strong>{canConfirm ? '0 ₽' : '—'}</strong>
              </div>
              <div className='summary-row'>
                <span>К оплате</span>
                <strong>{canConfirm ? `${draft.basePrice} ₽` : '—'}</strong>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <button
                className='btn btn-primary btn-block'
                type='button'
                disabled={!canConfirm || isLoading}
                aria-disabled={!canConfirm}
                onClick={handleConfirm}
              >
                {isLoading ? (
                  'Загрузка...'
                ) : (
                  <>
                    <i className='fa-solid fa-lock' aria-hidden='true'></i>
                    Подтвердить бронирование
                  </>
                )}
              </button>
              <button
                className='btn btn-danger btn-block'
                type='button'
                onClick={() => {
                  navigate('/booking');
                }}
                style={{ marginTop: 10 }}
              >
                <i className='fa-solid fa-xmark' aria-hidden='true'></i>
                Отменить
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
});

export default ConfirmationPage;
