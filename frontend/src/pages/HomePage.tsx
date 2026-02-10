import { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import {
  type Room,
  type Draft,
  type RoomType,
  type Feature,
  type RoomFilters,
  ROOM_TYPE_LABELS,
  ROOM_TYPES,
  FALLBACK_IMG,
} from '../types';

type HomePageProps = {
  rooms: Room[];
  roomsLoading: boolean;
  roomsError: string | null;
  hasMore: boolean;
  draft: Draft;
  filters: RoomFilters;
  nextPage: () => void;
  resetFilters: () => void;
  setFilter: <K extends keyof RoomFilters>(
    key: K,
    value: RoomFilters[K],
  ) => void;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
};

const HomePage = memo(function HomePage({
  rooms,
  roomsLoading,
  roomsError,
  draft,
  filters,
  hasMore,
  resetFilters,
  nextPage,
  setFilter,
  setDraft,
}: HomePageProps) {
  const navigate = useNavigate();

  const types = useMemo(() => ROOM_TYPES, []);

  // Ref для бесконечного скролла
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Защита от множественных загрузок
  const loadMoreLock = useRef(false);

  // пагинация комнат с установкой lock
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    // Не грузим, если уже грузим или больше нет страниц
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      entries => {
        const e = entries[0];
        if (!e?.isIntersecting) return;
        if (loadMoreLock.current) return;
        if (roomsLoading) return;
        if (!hasMore) return;

        loadMoreLock.current = true;
        nextPage();
      },
      { root: null, rootMargin: '700px 0px', threshold: 0 },
    );

    // если запрос упал — наблюдатель отключаем
    if (roomsError) {
      observer.disconnect();
      return;
    }

    observer.observe(node);
    return () => observer.disconnect();
  }, [nextPage, roomsLoading, roomsError, hasMore]);

  // Сбрасываем lock когда загрузка закончилась
  useEffect(() => {
    if (!roomsLoading) loadMoreLock.current = false;
  }, [roomsLoading]);

  // фильтры
  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilter(
        'type',
        e.target.value === 'any' ? undefined : (e.target.value as RoomType),
      );
    },
    [setFilter],
  );
  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraft(d => ({ ...d, date: e.target.value }));
    },
    [setDraft],
  );
  const handleCapacityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilter(
        'capacity',
        e.target.value === 'any' ? undefined : Number(e.target.value),
      );
    },
    [setFilter],
  );

  const uiType = (filters.type ?? 'any') as RoomType | 'any';
  const uiCapacity =
    filters.capacity == null ? 'any' : String(filters.capacity);

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
                value={uiType as Exclude<RoomType, null>}
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
                value={uiCapacity}
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

          <button className='btn btn-primary btn-block' onClick={resetFilters}>
            Сбросить фильтры
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
        ) : rooms.length === 0 ? (
          <div className='card pad' aria-label='Ничего не найдено'>
            <h3 className='card-title'>Ничего не найдено</h3>
            <p className='card-meta'>Попробуйте изменить фильтры.</p>
          </div>
        ) : null}

        {rooms.length > 0 ? (
          <div className='resource-grid'>
            {rooms.map(room => (
              <article key={room.id} className='card resource-card'>
                <div className='resource-media'>
                  <ImageGallery
                    showFullscreenButton={false}
                    showPlayButton={false}
                    showThumbnails={false}
                    showBullets={true}
                    lazyLoad={true}
                    onErrorImageURL={FALLBACK_IMG}
                    items={room.images.map(image => ({
                      original: image.image1x || FALLBACK_IMG,
                      thumbnail: image.image1x || FALLBACK_IMG,
                    }))}
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
                          navigate('/booking');
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

        {/* Бесконечный скролл + UI */}
        <div ref={loadMoreRef} aria-hidden='true' style={{ height: 1 }} />

        {rooms.length > 0 ? (
          <div className='card pad' style={{ marginTop: 16 }}>
            {roomsError ? (
              <div className='alert err' role='alert'>
                <i
                  className='fa-solid fa-triangle-exclamation'
                  aria-hidden='true'
                ></i>
                <div>
                  <h3>Не удалось подгрузить ещё</h3>
                  <p>{roomsError}</p>
                  <button
                    type='button'
                    className='btn btn-ghost'
                    onClick={nextPage}
                    disabled={roomsLoading}
                  >
                    Повторить
                  </button>
                </div>
              </div>
            ) : roomsLoading ? (
              <div
                className='alert info'
                aria-label='Загрузка следующей страницы'
              >
                <i className='fa-solid fa-spinner' aria-hidden='true'></i>
                <div>
                  <h3>Загружаем ещё…</h3>
                  <p className='card-meta'>
                    Подгружаем дополнительные объекты.
                  </p>
                </div>
              </div>
            ) : hasMore ? (
              <div className='resource-row' style={{ alignItems: 'center' }}>
                <div className='hint'>Прокрутите ниже — загрузим ещё.</div>
                <button
                  type='button'
                  className='btn btn-ghost'
                  onClick={nextPage}
                >
                  Загрузить ещё
                </button>
              </div>
            ) : (
              <div className='alert ok' aria-label='Конец списка'>
                <i className='fa-solid fa-circle-check' aria-hidden='true'></i>
                <div>
                  <h3>Это все объекты</h3>
                  <p className='card-meta'>Больше ничего нет.</p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
});

export default HomePage;
