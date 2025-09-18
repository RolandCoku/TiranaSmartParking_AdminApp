import { clsx, type ClassValue } from 'clsx';
import { format, parseISO, isValid } from 'date-fns';

// Utility function for conditional class names
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format currency
export function formatCurrency(amount: number, currency = 'ALL'): string {
  return new Intl.NumberFormat('sq-AL', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Format date
export function formatDate(date: string | Date, formatString = 'MMM dd, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid Date';
  return format(dateObj, formatString);
}

// Format date and time
export function formatDateTime(date: string | Date, formatString = 'MMM dd, yyyy HH:mm'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid Date';
  return format(dateObj, formatString);
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid Date';
  
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return formatDate(dateObj);
}

// Calculate occupancy percentage
export function calculateOccupancyRate(occupied: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((occupied / total) * 100);
}

// Get status color
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Booking statuses
    UPCOMING: 'bg-blue-100 text-blue-800',
    ACTIVE: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-yellow-100 text-yellow-800',
    
    // Session statuses (same as booking statuses)
    
    // System health
    HEALTHY: 'bg-green-100 text-green-800',
    WARNING: 'bg-yellow-100 text-yellow-800',
    CRITICAL: 'bg-red-100 text-red-800',
    
    // Sensor status
    ONLINE: 'bg-green-100 text-green-800',
    OFFLINE: 'bg-gray-100 text-gray-800',
    ERROR: 'bg-red-100 text-red-800',
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

// Get status icon
export function getStatusIcon(status: string): string {
  const statusIcons: Record<string, string> = {
    UPCOMING: 'Clock',
    ACTIVE: 'Play',
    COMPLETED: 'CheckCircle',
    CANCELLED: 'XCircle',
    EXPIRED: 'AlertCircle',
    HEALTHY: 'CheckCircle',
    WARNING: 'AlertTriangle',
    CRITICAL: 'AlertCircle',
    ONLINE: 'Wifi',
    OFFLINE: 'WifiOff',
    ERROR: 'AlertCircle',
  };
  
  return statusIcons[status] || 'Circle';
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (Albanian format)
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+355|0)[0-9]{8,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Format phone number
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('355')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  } else if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

// Calculate duration between two dates
export function calculateDuration(startDate: string | Date, endDate: string | Date): string {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  if (!isValid(start) || !isValid(end)) return 'Invalid duration';
  
  const diffInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }
  
  const hours = Math.floor(diffInMinutes / 60);
  const minutes = diffInMinutes % 60;
  
  if (hours < 24) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

// Get vehicle type icon
export function getVehicleTypeIcon(vehicleType: string): string {
  const vehicleIcons: Record<string, string> = {
    CAR: 'Car',
    MOTORCYCLE: 'Zap',
    TRUCK: 'Truck',
    BUS: 'Bus',
  };
  
  return vehicleIcons[vehicleType] || 'Car';
}

// Get user group color
export function getUserGroupColor(userGroup: string): string {
  const groupColors: Record<string, string> = {
    PUBLIC: 'bg-blue-100 text-blue-800',
    RESIDENT: 'bg-green-100 text-green-800',
    DISABLED: 'bg-purple-100 text-purple-800',
    STAFF: 'bg-orange-100 text-orange-800',
    STUDENT: 'bg-indigo-100 text-indigo-800',
  };
  
  return groupColors[userGroup] || 'bg-gray-100 text-gray-800';
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Generate booking reference
export function generateBookingReference(): string {
  const prefix = 'PCK';
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}${random}`;
}

// Generate session reference
export function generateSessionReference(): string {
  const prefix = 'PSN';
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}${random}`;
}

// Check if date is today
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
}

// Check if date is in the past
export function isPast(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj < new Date();
}

// Check if date is in the future
export function isFuture(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj > new Date();
}

// Get time of day
export function getTimeOfDay(date: string | Date): 'morning' | 'afternoon' | 'evening' | 'night' {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const hour = dateObj.getHours();
  
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Deep clone object
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Check if object is empty
export function isEmpty(obj: any): boolean {
  if (obj == null) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

// Sleep function for async operations
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
