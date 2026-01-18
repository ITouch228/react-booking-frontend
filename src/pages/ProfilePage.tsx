import { memo, useMemo } from 'react';
import Spinner from '../components/Spinner';
import { type Booking, type User } from '../types/index';

type ProfilePageProps = {
  user: User | null;
  bookings: Booking[];
  bookingsLoading: boolean;
  bookingsError: string | null;
};

const ProfilePage = memo(function ProfilePage({
  user,
  bookings,
  bookingsLoading,
  bookingsError,
}: ProfilePageProps) {
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

      {/* <input type='file' id='fileInput' />
      <button
        onClick={async () => {
          const file = document.getElementById('fileInput').files[0];

          await fetch(
            'https://s3.xn--80aqenr9bu.xn--p1ai/uploads/images/rooms/1/4c4b399c5b1f42b599a5b3b74ff9b157.png?AWSAccessKeyId=minioadmin&Signature=pDdZ6yqbWOmYl6tAXvkuEb402FU%3D&content-type=image%2Fpng&Expires=1768058673',
            {
              method: 'PUT',
              headers: {
                'Content-Type': file.type, // image/png
              },
              body: file,
            },
          );

          alert('Uploaded!');
        }}
      >
        Upload
      </button> */}

      <section className='card pad' aria-label='Данные пользователя'>
        {/* <div className='card-header'>
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
        </div> */}

        <form className='form' onSubmit={e => e.preventDefault()}>
          <div className='form-row'>
            <div className='field'>
              <label htmlFor='p-name'>Имя</label>
              <input
                id='p-name'
                className='control'
                value={user?.username ?? ''}
                readOnly
                tabIndex={-1}
              />
              <div className='hint'>Имя пользователя в системе</div>
            </div>

            <div className='field'>
              <label htmlFor='p-email'>Email</label>
              <input
                id='p-email'
                className='control'
                value={user?.email ?? ''}
                readOnly
                tabIndex={-1}
              />
              <div className='hint'>Email, привязанный к аккаунту</div>
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
            {bookings.length}
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
                {bookings.map(b => (
                  <tr key={b.booking.id}>
                    <td>{b.booking.room.name}</td>
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
