import type {
  User,
  AuthTokens,
  Hospital,
  Department,
  Doctor,
  AppointmentSlot,
  Booking,
  PaymentInitiateResponse,
  PaginatedResponse,
  HealthCheckResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiClient {
  private getHeaders(customHeaders: HeadersInit = {}): Headers {
    const headers = new Headers(customHeaders);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const token = localStorage.getItem('turna_access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: this.getHeaders(options.headers),
    });

    if (response.status === 401 && !endpoint.includes('/api/auth/login/')) {
      // Token might be expired
      localStorage.removeItem('turna_access_token');
      localStorage.removeItem('turna_refresh_token');
      localStorage.removeItem('turna_user');
      window.dispatchEvent(new Event('turna_auth_change'));
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorData: any = null;
      try {
        errorData = await response.json();
        if (errorData) {
          if (errorData.detail) errorMessage = errorData.detail;
          else if (errorData.error) errorMessage = errorData.error;
          else if (typeof errorData === 'object') {
            const firstKey = Object.keys(errorData)[0];
            const firstVal = errorData[firstKey];
            errorMessage = Array.isArray(firstVal) ? `${firstKey}: ${firstVal[0]}` : String(firstVal);
          }
        }
      } catch {
        // Response wasn't json
      }

      const error = new Error(errorMessage) as any;
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // --- Auth APIs ---
  async login(email: string, password: string): Promise<{ access: string; refresh: string; user: User }> {
    const data = await this.request<{ access: string; refresh: string; user: User }>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('turna_access_token', data.access);
    localStorage.setItem('turna_refresh_token', data.refresh);
    localStorage.setItem('turna_user', JSON.stringify(data.user));
    window.dispatchEvent(new Event('turna_auth_change'));
    return data;
  }

  async register(payload: {
    email: string;
    password: string;
    password_confirm: string;
    name: string;
    phone: string;
  }): Promise<{ user: User; tokens: AuthTokens }> {
    const data = await this.request<{ user: User; tokens: AuthTokens }>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.tokens) {
      localStorage.setItem('turna_access_token', data.tokens.access);
      localStorage.setItem('turna_refresh_token', data.tokens.refresh);
      localStorage.setItem('turna_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('turna_auth_change'));
    }
    return data;
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/api/auth/profile/');
  }

  async updateProfile(payload: Partial<User>): Promise<User> {
    const updated = await this.request<User>('/api/auth/profile/', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    localStorage.setItem('turna_user', JSON.stringify(updated));
    window.dispatchEvent(new Event('turna_auth_change'));
    return updated;
  }

  logout() {
    localStorage.removeItem('turna_access_token');
    localStorage.removeItem('turna_refresh_token');
    localStorage.removeItem('turna_user');
    window.dispatchEvent(new Event('turna_auth_change'));
  }

  // --- Hospitals APIs ---
  async getHospitals(params?: { search?: string; city?: string }): Promise<PaginatedResponse<Hospital> | Hospital[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.city) query.append('city', params.city);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<PaginatedResponse<Hospital> | Hospital[]>(`/api/hospitals/${qs}`);
  }

  async getHospitalDetail(id: number): Promise<Hospital> {
    return this.request<Hospital>(`/api/hospitals/${id}/`);
  }

  async getHospitalDepartments(hospitalId: number): Promise<PaginatedResponse<Department> | Department[]> {
    return this.request<PaginatedResponse<Department> | Department[]>(`/api/hospitals/${hospitalId}/departments/`);
  }

  // --- Doctors APIs ---
  async getDoctors(params?: {
    search?: string;
    department?: number | string;
    hospital?: number | string;
    specialization?: string;
  }): Promise<PaginatedResponse<Doctor> | Doctor[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.department) query.append('department', String(params.department));
    if (params?.hospital) query.append('hospital', String(params.hospital));
    if (params?.specialization) query.append('specialization', params.specialization);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<PaginatedResponse<Doctor> | Doctor[]>(`/api/doctors/${qs}`);
  }

  async getDoctorDetail(id: number): Promise<Doctor> {
    return this.request<Doctor>(`/api/doctors/${id}/`);
  }

  async getDoctorSlots(doctorId: number, date?: string): Promise<PaginatedResponse<AppointmentSlot> | AppointmentSlot[]> {
    const query = new URLSearchParams();
    if (date) query.append('date', date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<PaginatedResponse<AppointmentSlot> | AppointmentSlot[]>(`/api/doctors/${doctorId}/slots/${qs}`);
  }

  // --- Bookings APIs ---
  async initiatePayment(slotId: number): Promise<PaymentInitiateResponse> {
    return this.request<PaymentInitiateResponse>('/api/bookings/initiate-payment/', {
      method: 'POST',
      body: JSON.stringify({ slot_id: slotId }),
    });
  }

  async createBooking(payload: {
    slot_id: number;
    patient_name?: string;
    patient_phone?: string;
    notes?: string;
    payment_id?: string;
    payment_order_id?: string;
    payment_signature?: string;
  }): Promise<Booking> {
    return this.request<Booking>('/api/bookings/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMyBookings(): Promise<PaginatedResponse<Booking> | Booking[]> {
    return this.request<PaginatedResponse<Booking> | Booking[]>('/api/bookings/');
  }

  async getBookingDetail(id: number): Promise<Booking> {
    return this.request<Booking>(`/api/bookings/${id}/`);
  }

  async cancelBooking(id: number): Promise<{ message: string; booking_id: number; status: string; slot_status: string }> {
    return this.request<{ message: string; booking_id: number; status: string; slot_status: string }>(
      `/api/bookings/${id}/cancel/`,
      { method: 'POST' }
    );
  }

  // --- Health Checks ---
  async checkHealth(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>('/healthz/');
  }

  async checkReady(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>('/readyz/');
  }
}

export const api = new ApiClient();
