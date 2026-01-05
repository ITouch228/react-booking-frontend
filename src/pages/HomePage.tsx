import { memo, useMemo, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import {
  type Room,
  type Draft,
  type RoomType,
  type Feature,
  ROOM_TYPE_LABELS,
  ROOM_TYPES,
  FALLBACK_IMG,
} from '../types';

type HomePageProps = {
  rooms: Room[];
  roomsLoading: boolean;
  roomsError: string | null;
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
};

const HomePage = memo(function HomePage({
  rooms,
  roomsLoading,
  roomsError,
  draft,
  setDraft,
}: HomePageProps) {
  const navigate = useNavigate();

  const [capacity, setCapacity] = useState('any');
  const [type, setType] = useState<RoomType | 'any'>('any');
  const types = useMemo(() => ROOM_TYPES, []);

  // фильтрация комнат
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const okType = type === 'any' ? true : r.type === type;
      const okCapacity =
        capacity === 'any' ? true : r.capacity >= Number(capacity);
      return okType && okCapacity;
    });
  }, [rooms, type, capacity]);

  // фильтры
  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setType(e.target.value as RoomType | 'any');
    },
    [setType],
  );
  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraft(d => ({ ...d, date: e.target.value }));
    },
    [setDraft],
  );
  const handleCapacityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setCapacity(e.target.value);
    },
    [],
  );

  return (
    <div className='stack-lg'>
      <section className='hero' aria-label='Приветствие'>
        <div className='hero-inner'>
          <div>
            <h1>Бронируйте объекты быстро — без лишних шагов</h1>
            <p>
              Адаптивная верстка: карточки, формы, фильтры и страницы
              подтверждения. Использованы Flexbox, CSS Grid и mobile-first
              подход.
            </p>
            <div className='hero-cta'>
              <button
                className='btn btn-primary'
                type='button'
                onClick={() => navigate('/booking')}
              >
                <i className='fa-solid fa-calendar-plus' aria-hidden='true'></i>
                Перейти к бронированию
              </button>
            </div>
          </div>

          <div className='hero-media' aria-hidden='true'>
            <img
              src='/assets/hero.svg'
              srcSet='/assets/hero.svg 1x, /assets/hero@2x.svg 2x'
              alt=''
              loading='lazy'
              width='640'
              height='440'
            />
          </div>
        </div>
      </section>

      <section className='card pad' aria-label='Поиск доступных слотов'>
        <div className='card-header'>
          <div>
            <h2 className='card-title'>Поиск по слотам</h2>
            <p className='card-meta'>
              Фильтры по дате, типу, вместимости и времени суток.
            </p>
          </div>
          <span className='badge info'>
            <i className='fa-solid fa-filter' aria-hidden='true'></i> Фильтры
          </span>
        </div>

        <form
          className='form'
          onSubmit={e => {
            e.preventDefault();
            navigate('/booking');
          }}
        >
          <div className='form-row'>
            <div className='field'>
              <label htmlFor='home-date'>Дата</label>
              <input
                id='home-date'
                className='control'
                type='date'
                value={draft.date}
                onChange={handleDateChange}
              />
            </div>
            <div className='field'>
              <label htmlFor='home-type'>Тип</label>
              <select
                id='home-type'
                className='control'
                value={type as Exclude<RoomType, null>}
                onChange={handleTypeChange}
              >
                <option value='any'>Любой</option>
                {types.map(t => (
                  <option key={t} value={t}>
                    {ROOM_TYPE_LABELS(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className='field'>
              <label htmlFor='home-capacity'>Вместимость</label>
              <select
                id='home-capacity'
                className='control'
                value={capacity}
                onChange={handleCapacityChange}
              >
                <option value='any'>Не важно</option>
                <option value='1'>от 1</option>
                <option value='2'>от 2</option>
                <option value='4'>от 4</option>
                <option value='8'>от 8</option>
              </select>
            </div>
          </div>

          <button className='btn btn-primary btn-block' type='submit'>
            Показать все варианты
          </button>
        </form>
      </section>

      <section className='stack' aria-label='Список объектов'>
        <div>
          <h2 className='page-title'>Доступные объекты</h2>
          <p className='page-subtitle'>
            Карточки с адаптивными изображениями и быстрыми действиями.
          </p>
        </div>

        {roomsLoading && rooms.length === 0 ? (
          <div className='card pad' aria-label='Загрузка объектов'>
            <Spinner />
            <div className='hint' style={{ marginTop: 12 }}>
              Загружаем список объектов…
            </div>
          </div>
        ) : roomsError && rooms.length === 0 ? (
          <div className='card pad' aria-label='Ошибка загрузки'>
            <h3 className='card-title'>Не удалось загрузить объекты</h3>
            <p className='card-meta'>{roomsError}</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className='card pad' aria-label='Ничего не найдено'>
            <h3 className='card-title'>Ничего не найдено</h3>
            <p className='card-meta'>Попробуйте изменить фильтры.</p>
          </div>
        ) : null}

        {filteredRooms.length > 0 ? (
          <div className='resource-grid'>
            {filteredRooms.map(room => (
              <article key={room.id} className='card resource-card'>
                <div className='resource-media'>
                  <img
                    src={room.image1x || FALLBACK_IMG}
                    srcSet={`${room.image1x || FALLBACK_IMG} 1x, ${
                      room.image2x || FALLBACK_IMG
                    } 2x`}
                    alt={`Фото: ${room.name}`}
                    loading='lazy'
                    width='640'
                    height='400'
                    onError={e => {
                      const img = e.currentTarget;
                      img.onerror = null;
                      img.src = FALLBACK_IMG;
                      img.style = 'object-fit: contain';
                    }}
                  />
                </div>
                <div className='resource-body'>
                  <div className='resource-row'>
                    <div>
                      <h3 className='resource-name'>{room.name}</h3>
                      <p className='resource-desc'>
                        {ROOM_TYPE_LABELS(room.type)} · {room.location.name} ·{' '}
                        {room.location.address}
                      </p>
                    </div>
                    <span className='badge'>
                      <i className='fa-solid fa-users' aria-hidden='true'></i>{' '}
                      {room.capacity}
                    </span>
                  </div>
                  <div className='resource-tags' aria-label='Особенности'>
                    {room.features.map((f: Feature) => (
                      <span key={f.id} className='badge'>
                        <i className='fa-solid fa-check' aria-hidden='true'></i>{' '}
                        {f.name}
                      </span>
                    ))}
                  </div>
                  <div className='resource-row'>
                    <div>
                      <p className='resource-desc'>Цена</p>
                      <p className='resource-name'>
                        {room.hour_price != null && (
                          <span>{room.hour_price}</span>
                        )}{' '}
                        ₽ / час
                      </p>
                    </div>
                    <div className='resource-actions'>
                      <button
                        type='button'
                        className='btn btn-primary'
                        onClick={() => {
                          setDraft(d => ({
                            ...d,
                            roomId: room.id,
                          }));
                          navigate(
                            `/booking?room=${encodeURIComponent(room.id)}`,
                          );
                        }}
                      >
                        <i
                          className='fa-solid fa-arrow-right'
                          aria-hidden='true'
                        ></i>
                        Забронировать
                      </button>
                      <Link className='btn btn-ghost' to='/booking'>
                        Подробнее
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
});

export default HomePage;
