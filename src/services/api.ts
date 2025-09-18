import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { 
  ApiUser,
  UserResponseDTO,
  UserCreateDTO,
  UserUpdateDTO,
  CarCreateDTO,
  CarResponseDTO,
  UserCarsDTO,
  BookingDTO,
  BookingRegistrationDTO,
  BookingUpdateDTO,
  BookingQuoteDTO,
  BookingQuoteResponse,
  ParkingSessionDTO,
  ParkingSessionStartDTO,
  ParkingSessionUpdateDTO,
  ParkingSessionStopDTO,
  ParkingSessionQuoteDTO,
  SessionQuoteResponse,
  ParkingLot, 
  ParkingLotRegistrationDTO,
  ParkingSpace,
  RatePlan,
  RatePlanRegistrationDTO,
  RateRule,
  RateRuleRegistrationDTO,
  LotRateAssignment,
  LotRateAssignmentRegistrationDTO,
  SpaceRateOverride,
  SpaceRateOverrideRegistrationDTO,
  RoleDTO,
  RoleResponseDTO,
  DashboardStats,
  OccupancyData,
  SystemHealth,
  AnalyticsData,
  ApiResponse,
  PaginatedResponse,
  VehicleType,
  UserGroup
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  // Cookie utility methods
  private setCookie(name: string, value: string, days: number = 30): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    const isSecure = window.location.protocol === 'https:';
    const secureFlag = isSecure ? ';secure' : '';
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;samesite=lax${secureFlag}`;
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getCookie('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling and token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Don't try to refresh token if the request is already a refresh token request
        const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');
        
        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;
          
          const refreshToken = this.getCookie('refreshToken');
          if (refreshToken) {
            try {
              const response = await this.refreshToken(refreshToken);
              this.setCookie('authToken', response.accessToken, 1); // 1 day for access token
              this.setCookie('refreshToken', response.refreshToken, 30); // 30 days for refresh token
              
              // Process queued requests
              this.processQueue(null, response.accessToken);
              
              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
              return this.api(originalRequest);
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              this.processQueue(refreshError, null);
              // Refresh failed, redirect to login
              this.deleteCookie('authToken');
              this.deleteCookie('refreshToken');
              this.deleteCookie('rememberMe');
              window.location.href = '/login';
              return Promise.reject(refreshError);
            } finally {
              this.isRefreshing = false;
            }
          } else {
            // No refresh token, redirect to login
            this.deleteCookie('authToken');
            this.deleteCookie('refreshToken');
            this.deleteCookie('rememberMe');
            window.location.href = '/login';
            return Promise.reject(error);
          }
        }
        
        // If it's a refresh request that failed, clear tokens and redirect to login
        if (error.response?.status === 401 && isRefreshRequest) {
          console.error('Refresh token is invalid or expired');
          this.deleteCookie('authToken');
          this.deleteCookie('refreshToken');
          this.deleteCookie('rememberMe');
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(username: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
    issuedAt: number;
  }> {
    console.log('🌐 API Request: POST /auth/login', { username });
    const response: AxiosResponse<ApiResponse<{
      accessToken: string;
      refreshToken: string;
      tokenType: string;
      accessTokenExpiresIn: number;
      refreshTokenExpiresIn: number;
      issuedAt: number;
    }>> = await this.api.post('/auth/login', {
      username,
      password,
    });
    console.log('🌐 API Response: POST /auth/login', {
      status: response.status,
      data: response.data
    });
    return response.data.data;
  }

  async getCurrentUser(): Promise<ApiUser> {
    console.log('🌐 API Request: GET /me');
    const response: AxiosResponse<ApiResponse<ApiUser>> = await this.api.get('/me');
    console.log('🌐 API Response: GET /me', {
      status: response.status,
      data: response.data
    });
    return response.data.data;
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
    issuedAt: number;
  }> {
    console.log('🌐 API Request: POST /auth/refresh', { refreshToken: refreshToken.substring(0, 50) + '...' });
    const response: AxiosResponse<ApiResponse<{
      accessToken: string;
      refreshToken: string;
      tokenType: string;
      accessTokenExpiresIn: number;
      refreshTokenExpiresIn: number;
      issuedAt: number;
    }>> = await this.api.post('/auth/refresh', {
      refreshToken,
    });
    console.log('🌐 API Response: POST /auth/refresh', {
      status: response.status,
      data: response.data
    });
    return response.data.data;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response: AxiosResponse<ApiResponse<DashboardStats>> = await this.api.get('/admin/dashboard/stats');
    return response.data.data;
  }

  async getOccupancyData(): Promise<OccupancyData[]> {
    const response: AxiosResponse<ApiResponse<OccupancyData[]>> = await this.api.get('/admin/dashboard/occupancy');
    return response.data.data;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const response: AxiosResponse<ApiResponse<SystemHealth>> = await this.api.get('/admin/system/health');
    return response.data.data;
  }

  async getAnalyticsData(startDate?: string, endDate?: string): Promise<AnalyticsData> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response: AxiosResponse<ApiResponse<AnalyticsData>> = await this.api.get(`/admin/analytics?${params}`);
    return response.data.data;
  }

  // Parking Lots
  async getParkingLots(page = 0, size = 10): Promise<PaginatedResponse<ParkingLot>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<ParkingLot>>> = await this.api.get(
      `/admin/parking/lots?page=${page}&size=${size}`
    );
    return response.data.data;
  }

  async getParkingLot(id: number): Promise<ParkingLot> {
    const response: AxiosResponse<ApiResponse<ParkingLot>> = await this.api.get(`/admin/parking/lots/${id}`);
    return response.data.data;
  }

  async createParkingLot(lot: ParkingLotRegistrationDTO): Promise<ParkingLot> {
    const response: AxiosResponse<ApiResponse<ParkingLot>> = await this.api.post('/admin/parking/lots', lot);
    return response.data.data;
  }

  async updateParkingLot(id: number, lot: ParkingLotRegistrationDTO): Promise<ParkingLot> {
    const response: AxiosResponse<ApiResponse<ParkingLot>> = await this.api.put(`/admin/parking/lots/${id}`, lot);
    return response.data.data;
  }

  async deleteParkingLot(id: number): Promise<void> {
    await this.api.delete(`/admin/parking/lots/${id}`);
  }

  // Parking Spaces
  async getParkingSpaces(page = 0, size = 10, lotId?: number): Promise<PaginatedResponse<ParkingSpace>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (lotId) params.append('lotId', lotId.toString());

    const response: AxiosResponse<ApiResponse<PaginatedResponse<ParkingSpace>>> = await this.api.get(
      `/admin/parking/spaces?${params}`
    );
    return response.data.data;
  }

  async getParkingSpace(id: number): Promise<ParkingSpace> {
    const response: AxiosResponse<ApiResponse<ParkingSpace>> = await this.api.get(`/admin/parking/spaces/${id}`);
    return response.data.data;
  }

  async createParkingSpace(space: Partial<ParkingSpace>): Promise<ParkingSpace> {
    const response: AxiosResponse<ApiResponse<ParkingSpace>> = await this.api.post('/admin/parking/spaces', space);
    return response.data.data;
  }

  async updateParkingSpace(id: number, space: Partial<ParkingSpace>): Promise<ParkingSpace> {
    const response: AxiosResponse<ApiResponse<ParkingSpace>> = await this.api.put(`/admin/parking/spaces/${id}`, space);
    return response.data.data;
  }

  async deleteParkingSpace(id: number): Promise<void> {
    await this.api.delete(`/admin/parking/spaces/${id}`);
  }

  // Bookings - General endpoints
  async getBookings(page = 0, size = 10, sortBy = 'startTime', sortDir = 'desc'): Promise<PaginatedResponse<BookingDTO>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    params.append('sortDir', sortDir);

    const response: AxiosResponse<ApiResponse<PaginatedResponse<BookingDTO>>> = await this.api.get(
      `/bookings?${params}`
    );
    return response.data.data;
  }

  async getBooking(id: number): Promise<BookingDTO> {
    const response: AxiosResponse<ApiResponse<BookingDTO>> = await this.api.get(`/bookings/${id}`);
    return response.data.data;
  }

  async createBooking(booking: BookingRegistrationDTO): Promise<BookingDTO> {
    const response: AxiosResponse<ApiResponse<BookingDTO>> = await this.api.post('/bookings', booking);
    return response.data.data;
  }

  async updateBooking(id: number, booking: BookingUpdateDTO): Promise<BookingDTO> {
    const response: AxiosResponse<ApiResponse<BookingDTO>> = await this.api.put(`/bookings/${id}`, booking);
    return response.data.data;
  }

  async deleteBooking(id: number): Promise<void> {
    await this.api.delete(`/bookings/${id}`);
  }

  async cancelBooking(id: number): Promise<BookingDTO> {
    const response: AxiosResponse<ApiResponse<BookingDTO>> = await this.api.post(`/bookings/${id}/cancel`);
    return response.data.data;
  }

  async startBooking(id: number): Promise<BookingDTO> {
    const response: AxiosResponse<ApiResponse<BookingDTO>> = await this.api.post(`/bookings/${id}/start`);
    return response.data.data;
  }

  async completeBooking(id: number): Promise<BookingDTO> {
    const response: AxiosResponse<ApiResponse<BookingDTO>> = await this.api.post(`/bookings/${id}/complete`);
    return response.data.data;
  }

  async extendBooking(id: number, newEndTime: string): Promise<BookingDTO> {
    const response: AxiosResponse<ApiResponse<BookingDTO>> = await this.api.post(`/bookings/${id}/extend`, {
      newEndTime
    });
    return response.data.data;
  }

  async getBookingQuote(quote: BookingQuoteDTO): Promise<BookingQuoteResponse> {
    const response: AxiosResponse<ApiResponse<BookingQuoteResponse>> = await this.api.post('/bookings/quote', quote);
    return response.data.data;
  }

  async checkAvailability(spaceId: number, startTime: string, endTime: string): Promise<boolean> {
    const params = new URLSearchParams();
    params.append('spaceId', spaceId.toString());
    params.append('startTime', startTime);
    params.append('endTime', endTime);

    const response: AxiosResponse<ApiResponse<boolean>> = await this.api.get(`/bookings/availability?${params}`);
    return response.data.data;
  }

  // Admin-only booking endpoints
  async getBookingsBySpace(spaceId: number, page = 0, size = 10): Promise<PaginatedResponse<BookingDTO>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<BookingDTO>>> = await this.api.get(
      `/admin/bookings/spaces/${spaceId}?page=${page}&size=${size}`
    );
    return response.data.data;
  }

  async getBookingsByLot(lotId: number, page = 0, size = 10): Promise<PaginatedResponse<BookingDTO>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<BookingDTO>>> = await this.api.get(
      `/admin/bookings/lots/${lotId}?page=${page}&size=${size}`
    );
    return response.data.data;
  }

  async getBookingsByUser(userId: number, page = 0, size = 10, sortBy = 'startTime', sortDir = 'desc'): Promise<PaginatedResponse<BookingDTO>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    params.append('sortDir', sortDir);

    const response: AxiosResponse<ApiResponse<PaginatedResponse<BookingDTO>>> = await this.api.get(
      `/admin/bookings/users/${userId}?${params}`
    );
    return response.data.data;
  }

  // Sessions - General endpoints
  async getSessions(page = 0, size = 10, sortBy = 'startedAt', sortDir = 'desc'): Promise<PaginatedResponse<ParkingSessionDTO>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    params.append('sortDir', sortDir);

    const response: AxiosResponse<ApiResponse<PaginatedResponse<ParkingSessionDTO>>> = await this.api.get(
      `/parking-sessions?${params}`
    );
    return response.data.data;
  }

  async getSession(id: number): Promise<ParkingSessionDTO> {
    const response: AxiosResponse<ApiResponse<ParkingSessionDTO>> = await this.api.get(`/parking-sessions/${id}`);
    return response.data.data;
  }

  async startSession(session: ParkingSessionStartDTO): Promise<ParkingSessionDTO> {
    const response: AxiosResponse<ApiResponse<ParkingSessionDTO>> = await this.api.post('/parking-sessions', session);
    return response.data.data;
  }

  async updateSession(id: number, session: ParkingSessionUpdateDTO): Promise<ParkingSessionDTO> {
    const response: AxiosResponse<ApiResponse<ParkingSessionDTO>> = await this.api.put(`/parking-sessions/${id}`, session);
    return response.data.data;
  }

  async deleteSession(id: number): Promise<void> {
    await this.api.delete(`/parking-sessions/${id}`);
  }

  async stopSession(id: number, stopData: ParkingSessionStopDTO): Promise<ParkingSessionDTO> {
    const response: AxiosResponse<ApiResponse<ParkingSessionDTO>> = await this.api.post(`/parking-sessions/${id}/stop`, stopData);
    return response.data.data;
  }

  async cancelSession(id: number): Promise<ParkingSessionDTO> {
    const response: AxiosResponse<ApiResponse<ParkingSessionDTO>> = await this.api.post(`/parking-sessions/${id}/cancel`);
    return response.data.data;
  }

  async extendSession(id: number, newEndTime: string): Promise<ParkingSessionDTO> {
    const response: AxiosResponse<ApiResponse<ParkingSessionDTO>> = await this.api.post(`/parking-sessions/${id}/extend`, {
      newEndTime
    });
    return response.data.data;
  }

  async getSessionQuote(quote: ParkingSessionQuoteDTO): Promise<SessionQuoteResponse> {
    const response: AxiosResponse<ApiResponse<SessionQuoteResponse>> = await this.api.post('/parking-sessions/quote', quote);
    return response.data.data;
  }

  async checkSpaceAvailability(spaceId: number, startTime: string, endTime: string): Promise<boolean> {
    const params = new URLSearchParams();
    params.append('spaceId', spaceId.toString());
    params.append('startTime', startTime);
    params.append('endTime', endTime);

    const response: AxiosResponse<ApiResponse<boolean>> = await this.api.get(`/parking-sessions/availability?${params}`);
    return response.data.data;
  }

  // Admin-only session endpoints
  async getSessionsBySpace(spaceId: number, page = 0, size = 10): Promise<PaginatedResponse<ParkingSessionDTO>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<ParkingSessionDTO>>> = await this.api.get(
      `/admin/parking-sessions/spaces/${spaceId}?page=${page}&size=${size}`
    );
    return response.data.data;
  }

  async getSessionsByLot(lotId: number, page = 0, size = 10): Promise<PaginatedResponse<ParkingSessionDTO>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<ParkingSessionDTO>>> = await this.api.get(
      `/admin/parking-sessions/lots/${lotId}?page=${page}&size=${size}`
    );
    return response.data.data;
  }

  async getSessionsByUser(userId: number, page = 0, size = 10, sortBy = 'startedAt', sortDir = 'desc'): Promise<PaginatedResponse<ParkingSessionDTO>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    params.append('sortDir', sortDir);

    const response: AxiosResponse<ApiResponse<PaginatedResponse<ParkingSessionDTO>>> = await this.api.get(
      `/admin/parking-sessions/users/${userId}?${params}`
    );
    return response.data.data;
  }

  // Rate Management
  async getRatePlans(page = 0, size = 10): Promise<PaginatedResponse<RatePlan>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<RatePlan>>> = await this.api.get(
      `/admin/rates/plans?page=${page}&size=${size}`
    );
    return response.data.data;
  }

  async getRatePlan(id: number): Promise<RatePlan> {
    const response: AxiosResponse<ApiResponse<RatePlan>> = await this.api.get(`/admin/rates/plans/${id}`);
    return response.data.data;
  }

  async createRatePlan(plan: RatePlanRegistrationDTO): Promise<RatePlan> {
    const response: AxiosResponse<ApiResponse<RatePlan>> = await this.api.post('/admin/rates/plans', plan);
    return response.data.data;
  }

  async updateRatePlan(id: number, plan: RatePlanRegistrationDTO): Promise<RatePlan> {
    const response: AxiosResponse<ApiResponse<RatePlan>> = await this.api.put(`/admin/rates/plans/${id}`, plan);
    return response.data.data;
  }

  async deleteRatePlan(id: number): Promise<void> {
    await this.api.delete(`/admin/rates/plans/${id}`);
  }

  async getRateRules(page = 0, size = 10, planId?: number): Promise<PaginatedResponse<RateRule>> {
    const url = planId ? `/admin/rates/plans/${planId}/rules?page=${page}&size=${size}` : `/admin/rates/rules?page=${page}&size=${size}`;
    const response: AxiosResponse<ApiResponse<PaginatedResponse<RateRule>>> = await this.api.get(url);
    return response.data.data;
  }

  async getRateRule(id: number): Promise<RateRule> {
    const response: AxiosResponse<ApiResponse<RateRule>> = await this.api.get(`/admin/rates/rules/${id}`);
    return response.data.data;
  }

  async createRateRule(rule: RateRuleRegistrationDTO): Promise<RateRule> {
    const response: AxiosResponse<ApiResponse<RateRule>> = await this.api.post('/admin/rates/rules', rule);
    return response.data.data;
  }

  async updateRateRule(id: number, rule: RateRuleRegistrationDTO): Promise<RateRule> {
    const response: AxiosResponse<ApiResponse<RateRule>> = await this.api.put(`/admin/rates/rules/${id}`, rule);
    return response.data.data;
  }

  async deleteRateRule(id: number): Promise<void> {
    await this.api.delete(`/admin/rates/rules/${id}`);
  }

  async getLotRateAssignments(page = 0, size = 10, lotId?: number): Promise<PaginatedResponse<LotRateAssignment>> {
    const url = lotId ? `/admin/rates/lots/${lotId}/rate-assignments?page=${page}&size=${size}` : `/admin/rates/lot-assignments?page=${page}&size=${size}`;
    const response: AxiosResponse<ApiResponse<PaginatedResponse<LotRateAssignment>>> = await this.api.get(url);
    return response.data.data;
  }

  async getLotRateAssignment(id: number): Promise<LotRateAssignment> {
    const response: AxiosResponse<ApiResponse<LotRateAssignment>> = await this.api.get(`/admin/rates/lot-assignments/${id}`);
    return response.data.data;
  }

  async createLotRateAssignment(assignment: LotRateAssignmentRegistrationDTO): Promise<LotRateAssignment> {
    const response: AxiosResponse<ApiResponse<LotRateAssignment>> = await this.api.post('/admin/rates/lot-assignments', assignment);
    return response.data.data;
  }

  async updateLotRateAssignment(id: number, assignment: LotRateAssignmentRegistrationDTO): Promise<LotRateAssignment> {
    const response: AxiosResponse<ApiResponse<LotRateAssignment>> = await this.api.put(`/admin/rates/lot-assignments/${id}`, assignment);
    return response.data.data;
  }

  async deleteLotRateAssignment(id: number): Promise<void> {
    await this.api.delete(`/admin/rates/lot-assignments/${id}`);
  }

  async getSpaceRateOverrides(page = 0, size = 10, spaceId?: number): Promise<PaginatedResponse<SpaceRateOverride>> {
    const url = spaceId ? `/admin/rates/spaces/${spaceId}/rate-overrides?page=${page}&size=${size}` : `/admin/rates/space-overrides?page=${page}&size=${size}`;
    const response: AxiosResponse<ApiResponse<PaginatedResponse<SpaceRateOverride>>> = await this.api.get(url);
    return response.data.data;
  }

  async getSpaceRateOverride(id: number): Promise<SpaceRateOverride> {
    const response: AxiosResponse<ApiResponse<SpaceRateOverride>> = await this.api.get(`/admin/rates/space-overrides/${id}`);
    return response.data.data;
  }

  async createSpaceRateOverride(override: SpaceRateOverrideRegistrationDTO): Promise<SpaceRateOverride> {
    const response: AxiosResponse<ApiResponse<SpaceRateOverride>> = await this.api.post('/admin/rates/space-overrides', override);
    return response.data.data;
  }

  async updateSpaceRateOverride(id: number, override: SpaceRateOverrideRegistrationDTO): Promise<SpaceRateOverride> {
    const response: AxiosResponse<ApiResponse<SpaceRateOverride>> = await this.api.put(`/admin/rates/space-overrides/${id}`, override);
    return response.data.data;
  }

  async deleteSpaceRateOverride(id: number): Promise<void> {
    await this.api.delete(`/admin/rates/space-overrides/${id}`);
  }

  // Pricing
  async getPricingQuote(request: {
    parkingLotId?: number;
    parkingSpaceId?: number;
    vehicleType: VehicleType;
    userGroup: UserGroup;
    startTime: string;
    endTime: string;
  }): Promise<{ currency: string; amount: number; breakdown: string }> {
    const response: AxiosResponse<ApiResponse<{ currency: string; amount: number; breakdown: string }>> = await this.api.post('/pricing/quote', request);
    return response.data.data;
  }

  // Users
  async getUsers(page = 0, size = 10): Promise<PaginatedResponse<UserResponseDTO>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<UserResponseDTO>>> = await this.api.get(
      `/users?page=${page}&size=${size}`
    );
    return response.data.data;
  }

  async getUser(id: number): Promise<UserResponseDTO> {
    const response: AxiosResponse<ApiResponse<UserResponseDTO>> = await this.api.get(`/users/${id}`);
    return response.data.data;
  }

  async createUser(user: UserCreateDTO): Promise<UserResponseDTO> {
    const response: AxiosResponse<ApiResponse<UserResponseDTO>> = await this.api.post('/users', user);
    return response.data.data;
  }

  async updateUser(id: number, user: UserUpdateDTO): Promise<UserResponseDTO> {
    const response: AxiosResponse<ApiResponse<UserResponseDTO>> = await this.api.put(`/users/${id}`, user);
    return response.data.data;
  }

  async patchUser(id: number, user: UserUpdateDTO): Promise<UserResponseDTO> {
    const response: AxiosResponse<ApiResponse<UserResponseDTO>> = await this.api.patch(`/users/${id}`, user);
    return response.data.data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.api.delete(`/users/${id}`);
  }

  // User Cars
  async getUserCars(userId: number, page = 0, size = 10): Promise<PaginatedResponse<UserCarsDTO>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<UserCarsDTO>>> = await this.api.get(
      `/users/${userId}/cars?page=${page}&size=${size}`
    );
    return response.data.data;
  }

  async addUserCar(userId: number, car: CarCreateDTO): Promise<UserCarsDTO> {
    const response: AxiosResponse<ApiResponse<UserCarsDTO>> = await this.api.post(`/users/${userId}/cars`, car);
    return response.data.data;
  }

  async removeUserCar(userId: number, carId: number): Promise<void> {
    await this.api.delete(`/users/${userId}/cars/${carId}`);
  }

  // User Roles
  async addUserRole(userId: number, roles: string[]): Promise<UserResponseDTO> {
    const response: AxiosResponse<ApiResponse<UserResponseDTO>> = await this.api.patch(`/users/${userId}/roles`, roles);
    return response.data.data;
  }

  async removeUserRole(userId: number, roleName: string): Promise<UserResponseDTO> {
    const response: AxiosResponse<ApiResponse<UserResponseDTO>> = await this.api.delete(`/users/${userId}/roles/${roleName}`);
    return response.data.data;
  }

  // Cars
  async getCars(page = 0, size = 10): Promise<PaginatedResponse<CarResponseDTO>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<CarResponseDTO>>> = await this.api.get(
      `/cars?page=${page}&size=${size}`
    );
    return response.data.data;
  }

  async getCar(id: number): Promise<CarResponseDTO> {
    const response: AxiosResponse<ApiResponse<CarResponseDTO>> = await this.api.get(`/cars/${id}`);
    return response.data.data;
  }

  async createCar(car: CarCreateDTO): Promise<CarResponseDTO> {
    const response: AxiosResponse<ApiResponse<CarResponseDTO>> = await this.api.post('/cars', car);
    return response.data.data;
  }

  async updateCar(id: number, car: CarCreateDTO): Promise<UserCarsDTO> {
    const response: AxiosResponse<ApiResponse<UserCarsDTO>> = await this.api.put(`/cars/${id}`, car);
    return response.data.data;
  }

  async patchCar(id: number, car: CarCreateDTO): Promise<UserCarsDTO> {
    const response: AxiosResponse<ApiResponse<UserCarsDTO>> = await this.api.patch(`/cars/${id}`, car);
    return response.data.data;
  }

  async deleteCar(id: number): Promise<void> {
    await this.api.delete(`/cars/${id}`);
  }

  // Maintenance
  async updateExpiredBookings(): Promise<void> {
    await this.api.post('/admin/bookings/maintenance/update-expired');
  }

  async updateCompletedBookings(): Promise<void> {
    await this.api.post('/admin/bookings/maintenance/update-completed');
  }

  async updateExpiredSessions(): Promise<void> {
    await this.api.post('/admin/parking-sessions/maintenance/update-expired');
  }

  async updateCompletedSessions(): Promise<void> {
    await this.api.post('/admin/parking-sessions/maintenance/update-completed');
  }

  // Role Management
  async getRoles(): Promise<RoleResponseDTO[]> {
    const response: AxiosResponse<ApiResponse<RoleResponseDTO[]>> = await this.api.get('/roles');
    return response.data.data;
  }

  async getRole(id: number): Promise<RoleResponseDTO> {
    const response: AxiosResponse<ApiResponse<RoleResponseDTO>> = await this.api.get(`/roles/${id}`);
    return response.data.data;
  }

  async createRole(role: RoleDTO): Promise<RoleResponseDTO> {
    const response: AxiosResponse<ApiResponse<RoleResponseDTO>> = await this.api.post('/roles', role);
    return response.data.data;
  }

  async updateRole(id: number, role: RoleDTO): Promise<RoleResponseDTO> {
    const response: AxiosResponse<ApiResponse<RoleResponseDTO>> = await this.api.put(`/roles/${id}`, role);
    return response.data.data;
  }

  async patchRole(id: number, role: RoleDTO): Promise<RoleResponseDTO> {
    const response: AxiosResponse<ApiResponse<RoleResponseDTO>> = await this.api.patch(`/roles/${id}`, role);
    return response.data.data;
  }

  async deleteRole(id: number): Promise<void> {
    await this.api.delete(`/roles/${id}`);
  }

  async getAllPermissions(): Promise<string[]> {
    const response: AxiosResponse<ApiResponse<string[]>> = await this.api.get('/roles/permissions');
    return response.data.data;
  }
}

export const apiService = new ApiService();
export default apiService;
