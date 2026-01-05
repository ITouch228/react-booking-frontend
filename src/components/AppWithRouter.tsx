import { useEffect, useMemo } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import useLocalStorageState from '../hooks/useLocalStorageState';
import useAuth from '../hooks/useAuth';
import useRooms from '../hooks/useRooms';
import useTimeSlots from '../hooks/useTimeslots';
import useBookings from '../hooks/useBookings';
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
import type { Draft, Room } from '../types';

const AppWithRouter: React.FC = () => {
  const location = useLocation();

  const { user, setUser } = useAuth();
  const { rooms, roomsLoading, roomsError } = useRooms();
  const [draft, setDraft] = useLocalStorageState<Draft>('draft', {
    roomId: rooms[0]?.id || 1,
    roomName: '',
    date: new Date().toISOString().slice(0, 10),
    timeFrom: null,
    timeTo: null,
    time: null,
    hours: null,
    basePrice: '0',
  });
  const { timeSlots, timeslotsLoading, timeslotsError } = useTimeSlots(
    draft.roomId || rooms[0].id,
    draft.date || new Date().toISOString(),
  );
  const { bookings, setBookings, bookingsLoading, bookingsError } =
    useBookings();

  // изменение подписи сайта
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

  // Мемоизация Map для комнат
  const roomIndex = useMemo(() => {
    return rooms.reduce((acc, room) => {
      acc[room.id] = room;
      return acc;
    }, {} as Record<number, Room>);
  }, [rooms]);

  // Текущая комната (возможно нужно заменить в draft.room)
  const currentRoom = useMemo(
    () => roomIndex[draft.roomId] || roomIndex[1],
    [draft.roomId, roomIndex],
  );

  return (
    <AppShell>
      <Routes>
        <Route
          path='/'
          element={
            <HomePage
              draft={draft}
              setDraft={setDraft}
              rooms={rooms}
              roomsLoading={roomsLoading}
              roomsError={roomsError}
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
                setUser={setUser}
                rooms={rooms}
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
              roomIndex={roomIndex}
              currentRoom={currentRoom}
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
              room={currentRoom}
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
