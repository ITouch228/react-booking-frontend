export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (data: LoginPayload) => void;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface LoginPayload {
  access_token: string;
  user: User;
}

interface Image {
  image1x: string;
  image2x: string | null;
  type: 'ROOM' | 'LOCATION';
  file_id: number;
  room_id: number | null;
  location_id: number | null;
  id: number;
}

export interface User {
  username: string;
  email: string;
  role: Role;
}

interface Location {
  id: number;
  name: string;
  address: string;
  description: string;
  features: Feature[];
}

export interface Room {
  id: number;
  name: string;
  type: RoomType;
  capacity: number;
  description: string;
  hour_price: string;
  images: Image[];
  features: Feature[];
  time_slot_type: 'FLEXIBLE' | 'FIXED';
  location: Location;
  min_booking_duration_minutes: number;
  booking_step_minutes: number;
  image_id: number;
  location_id: number;
}

interface TimeslotBase {
  start_datetime: string;
  end_datetime: string;
  base_price: string;
  status: 'AVAILABLE' | 'BLOCKED';
  id: number;
  room_id: number;
}

export interface Timeslot {
  start_datetime: string;
  end_datetime: string;
  base_price: string;
  status: 'AVAILABLE' | 'BLOCKED';
  id: number;
  room_id: number;
  has_active_booking: boolean;
}

interface BookingBase {
  id: number;
  user_id: number;
  room_id: number;
  timeslot_id: number;
  status: 'PENDING_PAYMENTS' | 'PAID' | 'CANCELED' | 'EXPIRED';
  total_price: string;
  room: Room;
}

export interface Booking {
  booking: BookingBase;
  timeslot: TimeslotBase;
}

export interface Feature {
  id: 0;
  name: string;
  type: string;
  room_id: number;
  location_id: number;
}

export interface Draft {
  roomId: number;
  roomName: string;
  date: string;
  timeFrom: Date | null;
  timeTo: Date | null;
  time: string | null;
  hours: number | null;
  basePrice: string;
}

export type Role = 'GUEST' | 'USER' | 'ADMIN' | null;
export type DayPart = 'morning' | 'day' | 'evening' | 'any';
export type RoomType =
  | 'meeting-room'
  | 'cowork-desk'
  | 'studio'
  | 'sport'
  | null;

export interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
}

export const ROOM_TYPES: Exclude<RoomType, null>[] = [
  'meeting-room',
  'cowork-desk',
  'studio',
  'sport',
];

export const ROOM_TYPE_LABELS = (roomType: RoomType) => {
  if (!roomType) return 'Комната';
  else {
    const transliteral = {
      'meeting-room': 'Переговорная',
      'cowork-desk': 'Рабочее место',
      studio: 'Студия',
      sport: 'Спорт',
    };
    return transliteral[roomType];
  }
};

export const FALLBACK_IMG = '/assets/space-meeting.svg';
