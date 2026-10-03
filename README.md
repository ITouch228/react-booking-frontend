# Booking Frontend

> Полноценный SPA-клиент для бронирования рабочих мест: каталог переговорных и
> опенспейсов, фильтр по вместимости и типу, интерактивный выбор часового слота на
> pointer/touch-слайдере, корзина броней в localStorage, подтверждение и отмена.
> Чистый React + TypeScript без UI-китов и без react-query — вся работа с REST
> написана вручную на `fetch` и кастомных хуках.

![CI](https://github.com/ITouch228/react-booking-frontend/actions/workflows/ci.yml/badge.svg)

> ⚠️ **Демо и бэкенд сейчас офлайн.** REST-API писался под бэкенд коллеги на этапе
> его разработки; сейчас тот сервис недоступен, поэтому live-демо и прод-деплой
> выключены. Репозиторий — это **фронтенд-клиент**: код, тесты и CI по качеству.
> Чтобы запустить приложение с реальными данными, поднимите свой REST-API на пути
> `/api` (контракт методов — в разделе [REST API](#rest-api-контракт)).

## О проекте

Клиент учитывает реальные сценарии бронирования, а не только happy path:

- **Каталог мест** с пагинацией и фильтрами — по типу, вместимости, названию, описанию, цене
- **Интерактивный слайдер слотов** — работает мышью, пальцем, стрелками и Home/End;
  на мобильных перехватывает `touchmove` через не-passive слушатель, на десктопе — `pointermove`
- **Корзина броней** в localStorage: можно набрать несколько слотов и отправить батчем.
  Пересекающиеся с уже выбранными слоты блокируются
- **Мои брони** с отменой и подтверждением удаления, плюс экран «спасибо» после подтверждения
- **Аутентификация** через токен: он кладётся в `localStorage` и в `Authorization`
  каждого запроса; при `401` — автоматический logout
- **Устойчивость к ошибкам сети**: любой `fetch` с `AbortController` и обработкой
  `AbortError`, при 4xx/5xx бросается `ApiError` с кодом статуса — хуки показывают
  осмысленное сообщение

## Стек технологий

| Технология | Версия | Зачем |
|---|---|---|
| React | 19.2 | UI |
| TypeScript | 5.9 | Строгая типизация, `strict: true`, `noUnusedLocals`, `noUncheckedSideEffectImports` |
| Vite | 7.2 | Сборка, dev-server, preview |
| React Router | 7.9 | SPA-роутинг |
| Vitest | 2.1 | Unit- и hook-тесты (61 тест, 9 файлов) |
| Testing Library | 16 | Тесты хуков и компонентов через `renderHook` / `render` |
| jsdom | 24 | DOM-окружение для тестов |
| ESLint | 9 | Flat config: `@eslint/js` + `typescript-eslint` + `react-hooks` + `react-refresh` |

## Быстрый старт

```bash
cd frontend
npm install
npm run dev                 # → http://localhost:5173
```

`apiClient` бьёт в относительный путь `/api`. Живого бэкенда сейчас нет, поэтому
для работы каталога/броней укажите свой REST-API одним из способов:

- задайте `VITE_API_URL` на свой бэкенд (см. `src/api/apiClient.ts`), или
- добавьте `server.proxy` для `/api` в `vite.config.ts`, или
- поднимите mock-сервер (например, `msw`/`json-server`) на `/api`.

Без бэкенда приложение запускается и рендерит UI, но каталог и брони будут пусты
(хуки покажут состояние ошибки).

### Тесты, линтер, типы

```bash
cd frontend
npm test                    # 61 unit/hook-тестов (watch)
npm run test:run            # разовый прогон
npm run test:coverage       # прогон + покрытие ядра (72% statements / 88% functions)
npm run lint                # ESLint flat config
npm run typecheck           # tsc --noEmit
```

Покрытие считается по ядру (API-клиент, хуки, контекст, утилиты, слайдер слотов).
Страницы и layout-компоненты презентационные — их покрывают e2e, а не unit.

## Архитектура

### Frontend (SPA)

```
/pages        → роут-страницы (Home, Booking, Confirm, Profile, Login, SignUp, NotFound)
/components   → AppShell, AppWithRouter, Header, Footer, Spinner, TimeSlotSlider
/hooks        → useAuth, useBookings, useRooms, useRoom, useRoomFilters,
                useTimeslots, useLocalStorageState + AuthProvider/AuthContext
/api          → apiClient: единая обёртка над fetch (Bearer, авто-refresh, ApiError)
/types        → Room, Booking, Timeslot, User, Draft, RoomFilters, Role
/utils        → buildQuery, buildRoomsQuery, cx, parseTimeRangeToHours, convertNumericToTime
```

Принципы:

- **REST-слой изолирован в `apiClient.ts`** — любой хук вызывает только его,
  не `fetch` напрямую. Тестируется через `vi.stubGlobal('fetch', …)`.
- **Хуки возвращают `{ data…, loading, error }`** — единый контракт для всех
  сетевых хуков (`useRooms`, `useBookings`, `useTimeslots`, `useRoom`).
- **Отмена устаревших запросов через `AbortController`** — при смене фильтров или
  размонтировании компоненты предыдущий запрос отменяется, `AbortError` не просачивается.
- **Гарды роутов** — `ProtectedRoute` (по ролям `USER`/`ADMIN`) и `PublicOnlyRoute`
  редиректят с сохранением `?next=`.

## REST API (контракт)

Бэкенд в этот репозиторий не входит и сейчас не поставляется. Клиент ожидает
следующие методы (относительный base `/api`):

| Хук / страница | Метод | Путь |
|---|---|---|
| `LoginPage` | POST | `/auth/login` |
| `useAuth.refresh` | POST | `/auth/refresh` (httpOnly-cookie) |
| `useRooms` | GET | `/rooms/?page=&limit=&capacity=&type=…` |
| `useRoom` | GET | `/rooms/{id}` |
| `useTimeslots` | GET | `/rooms/{id}/timeslots?date_from=&date_to=` |
| `BookingPage` (прайс) | POST | `/rooms/{id}/price-quote` |
| `ConfirmPage` | POST | `/bookings/flexible` |
| `useBookings` | GET | `/bookings` |

## Модель данных (клиентские типы)

```
User        username, email, role: GUEST | USER | ADMIN
Room        id, name, type, capacity, description, hour_price,
            images[], features[], location, time_slot_type,
            min_booking_duration_minutes, booking_step_minutes
Timeslot    id, room_id, start_datetime, end_datetime,
            base_price, status: AVAILABLE | BLOCKED, has_active_booking
Booking     booking{id, user_id, room_id, timeslot_id, status, total_price, room},
            timeslot{...}
RoomFilters page, limit, locationId, name, capacity, type, hourPrice, isActive, …
```

Типы комнат — `MEETING_ROOM` / `COWORK_DESK` / `STUDIO` / `SPORT`. Статусы брони —
`PENDING_PAYMENTS` / `PAID` / `CANCELED` / `EXPIRED`. Сейчас клиент фильтрует каталог
только по `time_slot_type=FLEXIBLE` (фиксированные слоты не реализованы — см. Roadmap).

## Структура проекта

```
react-booking-frontend/
├── .github/workflows/
│   └── ci.yml                # lint + typecheck + test:coverage + coverage artifact
├── frontend/
│   ├── src/
│   │   ├── api/apiClient.ts           # fetch-обёртка, Bearer, авто-refresh, ApiError
│   │   ├── components/                # AppShell, Header, Footer, Spinner,
│   │   │                              # TimeSlotSlider (pointer+touch+keyboard)
│   │   ├── hooks/                     # useAuth/useBookings/useRooms/useRoom/
│   │   │                              # useRoomFilters/useTimeslots/useLocalStorageState
│   │   ├── pages/                     # роут-страницы
│   │   ├── routes/                    # ProtectedRoute, PublicOnlyRoute
│   │   ├── types/index.ts             # Room, Booking, Timeslot, User, RoomFilters, Role
│   │   ├── utils/utils.ts             # query-билдеры, парсеры, time-format
│   │   ├── App.tsx                    # HashRouter + AuthProvider
│   │   └── main.tsx
│   ├── tests/                         # 9 тестовых файлов, 61 тест
│   ├── vite.config.ts / vitest.config.ts
│   └── eslint.config.js               # flat config
└── .gitignore
```

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) — на каждый push в `main` и PR:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test:coverage`
5. загрузка coverage-артефакта

> Прод-деплой и nginx/Docker вырезаны: сервер остановлен, бэкенд недоступен.

## Roadmap

- [ ] Playwright e2e: логин → выбор комнаты → слот → подтверждение
- [ ] Фиксированные тайм-слоты (сейчас хардкод `time_slot_type=FLEXIBLE`)
- [ ] Покрытие тестами страниц (React Testing Library + MemoryRouter)
- [ ] Вернуть live-демо при появлении живого бэкенда

## Лицензия

MIT — подробности в файле [LICENSE](LICENSE).
