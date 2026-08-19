export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  is_staff: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Department {
  id: number;
  hospital: number;
  hospital_name?: string;
  name: string;
  description: string;
  doctors_count: number;
  created_at?: string;
}

export interface Hospital {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  email: string;
  image_url: string | null;
  departments_count: number;
  doctors_count: number;
  departments?: Department[];
  created_at?: string;
  updated_at?: string;
}

export interface DoctorSchedule {
  id: number;
  doctor: number;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  created_at?: string;
}

export interface Doctor {
  id: number;
  department: number;
  department_name: string;
  hospital_id: number;
  hospital_name: string;
  hospital_city: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  experience_years: number;
  consultation_fee: string | number;
  image_url: string | null;
  is_active: boolean;
  schedules?: DoctorSchedule[];
  created_at?: string;
}

export interface AppointmentSlot {
  id: number;
  doctor: number;
  doctor_name: string;
  hospital_name: string;
  department_name: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  fee: string | number;
  created_at?: string;
}

export interface NotificationItem {
  id: number;
  type: 'CONFIRMATION' | 'REMINDER' | 'CANCELLATION';
  scheduled_at: string;
  sent_at: string | null;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  created_at?: string;
}

export interface Booking {
  id: number;
  user: number;
  slot: number | AppointmentSlot;
  doctor: number;
  doctor_name: string;
  doctor_specialization: string;
  doctor_phone?: string;
  hospital: number;
  hospital_name: string;
  hospital_address?: string;
  hospital_city: string;
  department_name: string;
  slot_date: string;
  slot_start_time: string;
  slot_end_time: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  payment_id: string;
  payment_order_id?: string;
  payment_status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  amount_paid: string | number;
  patient_name: string;
  patient_phone: string;
  notes?: string;
  notifications?: NotificationItem[];
  created_at: string;
  updated_at?: string;
}

export interface PaymentInitiateResponse {
  order_id: string;
  amount: number;
  currency: string;
  receipt: string;
  key_id: string;
  mock_mode: boolean;
  notes?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
  environment?: string;
  database?: string;
  cache?: string;
}
