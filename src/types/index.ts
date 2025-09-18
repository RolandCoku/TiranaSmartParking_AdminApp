// User and Authentication Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response User type (what the backend actually returns)
export interface ApiUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Array<{ name: string; description: string | null }>;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// User Management Types
export interface UserResponseDTO {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: RoleDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateDTO {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  phoneNumber?: string;
  roles: string[];
}

export interface UserUpdateDTO {
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  email: string;
  phoneNumber?: string;
}

// Car Management Types
export interface CarCreateDTO {
  licensePlate: string;
  brand: string;
  model: string;
  color: string;
}

export interface CarResponseDTO {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  color: string;
  userId: number;
  userFirstName: string;
  userLastName: string;
}

export interface UserCarsDTO {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  PERSONNEL: 'PERSONNEL'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// Role Management Types
export interface Role {
  id: number;
  roleName: string;
  description: string;
  permissions: string[];
}

export interface RoleDTO {
  name: string;
  description: string;
  permissions: string[];
}

export interface RoleResponseDTO {
  id: number;
  roleName: string;
  description: string;
  permissions: string[];
}

// Parking Types
export interface ParkingLot {
  id: number;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  operatingHours?: string;
  status: string;
  latitude?: number;
  longitude?: number;
  publicAccess: boolean;
  hasChargingStations: boolean;
  hasDisabledAccess: boolean;
  hasCctv: boolean;
  covered?: boolean;
  capacity: number;
  availableSpaces: number;
  availabilityUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingLotRegistrationDTO {
  source: string;
  name: string;
  description?: string;
  address: string;
  active: boolean;
  publicAccess: boolean;
  hasChargingStations: boolean;
  hasDisabledAccess: boolean;
  hasCctv: boolean;
  capacity: number;
  availableSpaces: number;
  longitude?: number;
  latitude?: number;
}

export interface ParkingSpace {
  id: number;
  label: string;
  parkingLotId?: number;
  parkingLotName?: string;
  parkingLotAddress?: string;
  isAvailable: boolean;
  vehicleType: VehicleType;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export const VehicleType = {
  CAR: 'CAR',
  MOTORCYCLE: 'MOTORCYCLE',
  TRUCK: 'TRUCK',
  BUS: 'BUS'
} as const;

export type VehicleType = typeof VehicleType[keyof typeof VehicleType];

export const UserGroup = {
  PUBLIC: 'PUBLIC',
  RESIDENT: 'RESIDENT',
  DISABLED: 'DISABLED',
  STAFF: 'STAFF',
  STUDENT: 'STUDENT'
} as const;

export type UserGroup = typeof UserGroup[keyof typeof UserGroup];

// Booking Types
export interface Booking {
  id: number;
  userId: number;
  userEmail: string;
  parkingSpaceId: number;
  parkingSpaceLabel: string;
  parkingLotId?: number;
  parkingLotName?: string;
  parkingLotAddress?: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  userGroup: UserGroup;
  startTime: string;
  endTime: string;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  bookingReference: string;
  paymentMethodId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Booking Management Types
export interface BookingDTO {
  id: number;
  userId: number;
  userEmail: string;
  parkingSpaceId: number;
  parkingSpaceLabel: string;
  parkingLotId: number;
  parkingLotName: string;
  parkingLotAddress: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  userGroup: UserGroup;
  startTime: string;
  endTime: string;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  bookingReference: string;
  paymentMethodId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRegistrationDTO {
  parkingSpaceId: number;
  vehiclePlate: string;
  vehicleType: VehicleType;
  userGroup: UserGroup;
  startTime: string;
  endTime: string;
  paymentMethodId?: string;
  notes?: string;
}

export interface BookingUpdateDTO {
  vehiclePlate?: string;
  vehicleType?: VehicleType;
  userGroup?: UserGroup;
  startTime?: string;
  endTime?: string;
  status?: BookingStatus;
  paymentMethodId?: string;
  notes?: string;
}

export interface BookingQuoteDTO {
  parkingSpaceId: number;
  vehicleType: VehicleType;
  userGroup: UserGroup;
  startTime: string;
  endTime: string;
}

export interface BookingQuoteResponse {
  currency: string;
  amount: number;
  breakdown: string;
}

export const BookingStatus = {
  UPCOMING: 'UPCOMING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
} as const;

export type BookingStatus = typeof BookingStatus[keyof typeof BookingStatus];

// Session Types
export interface ParkingSession {
  id: number;
  userId: number;
  userEmail: string;
  parkingSpaceId: number;
  parkingSpaceLabel: string;
  parkingLotId?: number;
  parkingLotName?: string;
  parkingLotAddress?: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  userGroup: UserGroup;
  startedAt: string;
  endedAt?: string;
  billedAmount: number;
  currency: string;
  status: SessionStatus;
  sessionReference: string;
  paymentMethodId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Session Management Types
export interface ParkingSessionDTO {
  id: number;
  userId: number;
  userEmail: string;
  parkingSpaceId: number;
  parkingSpaceLabel: string;
  parkingLotId: number;
  parkingLotName: string;
  parkingLotAddress: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  userGroup: UserGroup;
  startedAt: string;
  endedAt?: string;
  billedAmount: number;
  currency: string;
  status: SessionStatus;
  sessionReference: string;
  paymentMethodId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingSessionStartDTO {
  parkingSpaceId: number;
  vehiclePlate: string;
  vehicleType: VehicleType;
  userGroup: UserGroup;
  paymentMethodId?: string;
  notes?: string;
}

export interface ParkingSessionUpdateDTO {
  vehiclePlate?: string;
  vehicleType?: VehicleType;
  userGroup?: UserGroup;
  endTime?: string;
  status?: SessionStatus;
  paymentMethodId?: string;
  notes?: string;
}

export interface ParkingSessionStopDTO {
  endTime: string;
  notes?: string;
}

export interface ParkingSessionQuoteDTO {
  parkingSpaceId: number;
  vehicleType: VehicleType;
  userGroup: UserGroup;
  startTime: string;
  endTime: string;
}

export interface SessionQuoteResponse {
  currency: string;
  amount: number;
  breakdown: string;
}

export const SessionStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
} as const;

export type SessionStatus = typeof SessionStatus[keyof typeof SessionStatus];

// Rate Management Types
export interface RatePlan {
  id: number;
  name: string;
  type: RatePlanType;
  currency: string;
  timeZone: string;
  graceMinutes?: number;
  incrementMinutes?: number;
  dailyCap?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const RatePlanType = {
  FLAT_PER_ENTRY: 'FLAT_PER_ENTRY',
  PER_HOUR: 'PER_HOUR',
  TIERED: 'TIERED',
  TIME_OF_DAY: 'TIME_OF_DAY',
  DAY_OF_WEEK: 'DAY_OF_WEEK',
  FREE: 'FREE',
  DYNAMIC: 'DYNAMIC'
} as const;

export type RatePlanType = typeof RatePlanType[keyof typeof RatePlanType];

export interface RatePlanRegistrationDTO {
  name: string;
  type: RatePlanType;
  currency: string;
  timeZone: string;
  graceMinutes?: number;
  incrementMinutes?: number;
  dailyCap?: number;
  active: boolean;
}

export interface RateRule {
  id: number;
  ratePlanId: number;
  startMinute?: number;
  endMinute?: number;
  startTime?: string;
  endTime?: string;
  dayOfWeek?: string;
  vehicleType?: VehicleType;
  userGroup?: UserGroup;
  pricePerHour?: number;
  priceFlat?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RateRuleRegistrationDTO {
  ratePlanId: number;
  startMinute?: number;
  endMinute?: number;
  startTime?: string;
  endTime?: string;
  dayOfWeek?: string;
  vehicleType?: VehicleType;
  userGroup?: UserGroup;
  pricePerHour?: number;
  priceFlat?: number;
}

export interface LotRateAssignment {
  id: number;
  parkingLotId: number;
  ratePlanId: number;
  priority: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LotRateAssignmentRegistrationDTO {
  parkingLotId: number;
  ratePlanId: number;
  priority: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface SpaceRateOverride {
  id: number;
  parkingSpaceId: number;
  ratePlanId: number;
  priority: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceRateOverrideRegistrationDTO {
  parkingSpaceId: number;
  ratePlanId: number;
  priority: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalSpots: number;
  occupiedSpots: number;
  availableSpots: number;
  activeBookings: number;
  activeSessions: number;
  todayRevenue: number;
  occupancyRate: number;
}

export interface OccupancyData {
  lotId: number;
  lotName: string;
  totalSpaces: number;
  occupiedSpaces: number;
  availableSpaces: number;
  occupancyRate: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  hasContent: boolean;
}

// System Health Types
export interface SystemHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  lastUpdate: string;
  sensorStatus: SensorStatus[];
  systemErrors: SystemError[];
}

export interface SensorStatus {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  lastUpdate: string;
  location: string;
}

export interface SystemError {
  id: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  timestamp: string;
  source: string;
  resolved: boolean;
}

// Analytics Types
export interface AnalyticsData {
  occupancyTrends: OccupancyTrend[];
  revenueData: RevenueData[];
  peakHours: PeakHourData[];
  userActivity: UserActivityData[];
}

export interface OccupancyTrend {
  date: string;
  occupancyRate: number;
  totalSpaces: number;
  occupiedSpaces: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  currency: string;
  bookings: number;
  sessions: number;
}

export interface PeakHourData {
  hour: number;
  occupancyRate: number;
  averageRevenue: number;
}

export interface UserActivityData {
  date: string;
  newUsers: number;
  activeUsers: number;
  bookings: number;
  sessions: number;
}
