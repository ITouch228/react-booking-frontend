import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import { type Booking, type Room, type User } from '../types/index';

type ProfilePageProps = {
  user: User | null;
  rooms: Room[];
  bookings: Booking[];
  bookingsLoading: boolean;
  bookingsError: string | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

const ProfilePage = memo(function ProfilePage({
  user,
  rooms,
  bookings,
  bookingsLoading,
  bookingsError,
  setUser,
}: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<Partial<User> | null>(user);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // синхронизация драфта с юзером
  useEffect(() => {
    setDraft(user);
  }, [user]);

  // установка фокуса на поле в режиме редактирования
  useEffect(() => {
    if (isEditing) firstInputRef.current?.focus?.();
  }, [isEditing]);

  // пока чисто UI
  const handleEdit = useCallback(() => {
    if (draft && draft.email && draft.username && draft.role && user) {
      const updatedUser: User = {
        ...user,
        username: draft.username,
        email: draft.email,
      };
      setUser(updatedUser);
      setIsEditing(false);
      toast.success('Профиль успешно обновлен');
    } else {
      toast.warning('Все обязательные поля должны быть заполнены');
    }
  }, [draft, user, setUser]);

  // брони уже с roomName для отображения
  const bookingView = useMemo(() => {
    const byId = Object.fromEntries(rooms.map((r: Room) => [r.id, r]));

    return bookings.map(b => ({
      ...b,
      roomName: byId[b.booking.room_id]?.name || 'Комната',
    }));
  }, [rooms, bookings]);

  // информация о бронях (количество и сумма)
  const bookingsSummary = useMemo(() => {
    const total = bookings.reduce(
      (sum: number, b: Booking) =>
        sum + (b.booking.status === 'PAID' ? Number(b.booking.total_price) : 0),
      0,
    );
    const active = bookings.filter(b => b.booking.status === 'PAID').length;
    return { total, active };
  }, [bookings]);

  return (
    <div className='stack'>
      <div>
        <h1 className='page-title'>Профиль</h1>
        <p className='page-subtitle'>
          Данные пользователя, история бронирований, режим редактирования.
        </p>
      </div>

      <div className='kpi' aria-label='Сводка'>
        <div className='card'>
          <strong>{bookingsSummary.active}</strong>
          <span>Активных бронирований</span>
        </div>
        <div className='card'>
          <strong>{bookingsSummary.total} ₽</strong>
          <span>Сумма бронирований</span>
        </div>
      </div>

      <section className='card pad' aria-label='Данные пользователя'>
        <div className='card-header'>
          <div>
            <h2 className='card-title'>Личные данные</h2>
            <p className='card-meta'>
              Кнопки «Редактировать» и «Сохранить» — четкие и заметные.
            </p>
          </div>
          <div className='resource-actions'>
            {!isEditing ? (
              <button
                className='btn btn-primary'
                type='button'
                onClick={() => setIsEditing(true)}
              >
                <i className='fa-solid fa-pen' aria-hidden='true'></i>
                Редактировать
              </button>
            ) : (
              <>
                <button
                  className='btn btn-primary'
                  type='button'
                  onClick={() => handleEdit()}
                >
                  <i className='fa-solid fa-floppy-disk' aria-hidden='true'></i>
                  Сохранить
                </button>
                <button
                  className='btn btn-ghost'
                  type='button'
                  onClick={() => {
                    setDraft(user);
                    setIsEditing(false);
                  }}
                >
                  Отмена
                </button>
              </>
            )}
          </div>
        </div>

        <form className='form' onSubmit={e => e.preventDefault()}>
          <div className='form-row'>
            <div className='field'>
              <label htmlFor='p-name'>Имя</label>
              <input
                ref={firstInputRef}
                id='p-name'
                className='control'
                value={draft?.username}
                onChange={e =>
                  setDraft(d => ({
                    ...d,
                    email: d?.email,
                    username: e.target.value,
                  }))
                }
                disabled={!isEditing}
              />
            </div>
            <div className='field'>
              <label htmlFor='p-email'>Email</label>
              <input
                id='p-email'
                className='control'
                value={draft?.email}
                onChange={e => setDraft(d => ({ ...d, email: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
          </div>
        </form>
      </section>

      <section className='card pad' aria-label='История бронирований'>
        <div className='card-header'>
          <div>
            <h2 className='card-title'>История бронирований</h2>
            <p className='card-meta'>Табличное представление</p>
          </div>
          <span className='badge'>
            <i className='fa-solid fa-clock-rotate-left' aria-hidden='true'></i>{' '}
            {bookingView.length}
          </span>
        </div>

        {bookingsLoading ? (
          <div className='card pad' aria-label='Загрузка объектов'>
            <Spinner />
            <div className='hint' style={{ marginTop: 12 }}>
              Загружаем ваши брони...
            </div>
          </div>
        ) : bookingsError ? (
          <div className='card pad' aria-label='Ошибка загрузки'>
            <h3 className='card-title'>Не удалось загрузить ваши брони</h3>
            <p className='card-meta'>{bookingsError}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className='table'>
              <thead>
                <tr>
                  <th>Объект</th>
                  <th>Дата</th>
                  <th>Время</th>
                  <th>Стоимость</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {bookingView.map(b => (
                  <tr key={b.booking.id}>
                    <td>{b.roomName}</td>
                    <td>
                      {new Date(b.timeslot.start_datetime).toLocaleDateString(
                        'ru-RU',
                        { year: 'numeric', month: 'numeric', day: 'numeric' },
                      )}
                    </td>
                    <td>
                      {new Date(b.timeslot.start_datetime).toLocaleTimeString(
                        'ru-RU',
                        { hour: 'numeric', minute: 'numeric' },
                      )}
                      -
                      {new Date(b.timeslot.end_datetime).toLocaleTimeString(
                        'ru-RU',
                        { hour: 'numeric', minute: 'numeric' },
                      )}
                    </td>
                    <td>{b.booking.total_price} ₽</td>
                    <td>
                      {b.booking.status === 'CANCELED' ? (
                        <span className='badge err'>
                          <i
                            className='fa-solid fa-xmark'
                            aria-hidden='true'
                          ></i>{' '}
                          Отменено
                        </span>
                      ) : b.booking.status === 'PENDING_PAYMENTS' ? (
                        <span className='badge warn'>
                          <i
                            className='fa-solid fa-credit-card'
                            aria-hidden='true'
                          ></i>{' '}
                          Подтвержден, ждет оплату
                        </span>
                      ) : b.booking.status === 'PAID' ? (
                        <span className='badge ok'>
                          <i
                            className='fa-solid fa-circle-check'
                            aria-hidden='true'
                          ></i>{' '}
                          Оплачено
                        </span>
                      ) : (
                        <span className='badge'>
                          <i className='fa fa-clock' aria-hidden='true'></i>{' '}
                          {b.booking.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
});

export default ProfilePage;
