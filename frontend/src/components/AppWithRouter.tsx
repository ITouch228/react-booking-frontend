import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import useLocalStorageState from '../hooks/useLocalStorageState';
import useAuth from '../hooks/useAuth';
import useRooms from '../hooks/useRooms';
import useTimeSlots from '../hooks/useTimeslots';
import useBookings from '../hooks/useBookings';
import useRoomFilters from '../hooks/useRoomFilters';
import AppShell from './AppShell';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import SignUpPage from '../pages/SignUpPage';
import ProfilePage from '../pages/ProfilePage';
import BookingPage from '../pages/BookingPage';
import ConfirmationPage from '../pages/ConfirmPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from '../routes/ProtectedRoute';
import PublicOnlyRoute from '../routes/PublicOnlyRoute';
import type { Draft } from '../types';

const AppWithRouter: React.FC = () => {
  const location = useLocation();

  const { user } = useAuth();
  const { filters, setFilter, resetFilters, nextPage } = useRoomFilters();
  const { rooms, roomsLoading, roomsError, hasMore } = useRooms(filters);
  const [draft, setDraft] = useLocalStorageState<Draft>('draft', {
    roomId: rooms[0]?.id || 1,
    date: new Date().toISOString().slice(0, 10),
    timeFrom: null,
    timeTo: null,
    time: '0:00-1:00',
    hours: 1,
    basePrice: '0',
  });
  const { timeSlots, timeslotsLoading, timeslotsError } = useTimeSlots(
    draft.roomId,
    draft.date,
  );
  const { bookings, setBookings, bookingsLoading, bookingsError } =
    useBookings();

  // изменение подписи сверху страницы
  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Home · Pet-Project',
      '/login': 'Login · Pet-Project',
      '/signup': 'Sign Up · Pet-Project',
      '/profile': 'Profile · Pet-Project',
      '/booking': 'Booking · Pet-Project',
      '/confirmation': 'Confirmation · Pet-Project',
      '/notifications': 'Notifications · Pet-Project',
    };
    document.title = titles[location.pathname] || 'Pet-Project';
  }, [location.pathname]);

  return (
    <AppShell>
      <Routes>
        <Route
          path='/'
          element={
            <HomePage
              rooms={rooms}
              roomsLoading={roomsLoading}
              roomsError={roomsError}
              filters={filters}
              hasMore={hasMore}
              draft={draft}
              nextPage={nextPage}
              resetFilters={resetFilters}
              setFilter={setFilter}
              setDraft={setDraft}
            />
          }
        />
        <Route element={<PublicOnlyRoute />}>
          <Route path='/login' element={<LoginPage />} />
          <Route path='/signup' element={<SignUpPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['USER', 'ADMIN']} />}>
          <Route
            path='/profile'
            element={
              <ProfilePage
                user={user}
                bookings={bookings}
                bookingsLoading={bookingsLoading}
                bookingsError={bookingsError}
              />
            }
          />
        </Route>
        <Route
          path='/booking'
          element={
            <BookingPage
              rooms={rooms}
              roomsLoading={roomsLoading}
              roomsError={roomsError}
              timeslots={timeSlots}
              timeslotsLoading={timeslotsLoading}
              timeslotsError={timeslotsError}
              draft={draft}
              setDraft={setDraft}
            />
          }
        />
        <Route
          path='/confirmation'
          element={
            <ConfirmationPage
              draft={draft}
              bookings={bookings}
              setBookings={setBookings}
            />
          }
        />
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
};

export default AppWithRouter;
