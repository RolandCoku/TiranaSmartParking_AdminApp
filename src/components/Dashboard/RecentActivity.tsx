import React from 'react';
import { MdAccessTime, MdEvent, MdLocationOn, MdPerson } from 'react-icons/md';
import type { Booking, ParkingSession } from '../../types';
import { formatDateTime, getStatusColor, cn } from '../../utils';

interface RecentActivityProps {
  bookings: Booking[];
  sessions: ParkingSession[];
  className?: string;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ bookings, sessions, className }) => {
  // Combine and sort activities by creation time
  const activities = [
    ...bookings.map(booking => ({
      id: `booking-${booking.id}`,
      type: 'booking' as const,
      data: booking,
      timestamp: booking.createdAt,
    })),
    ...sessions.map(session => ({
      id: `session-${session.id}`,
      type: 'session' as const,
      data: session,
      timestamp: session.createdAt,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
   .slice(0, 10);

  const getActivityIcon = (type: 'booking' | 'session') => {
    return type === 'booking' ? MdEvent : MdAccessTime;
  };

  const getActivityTitle = (activity: any) => {
    if (activity.type === 'booking') {
      return `New booking ${activity.data.bookingReference}`;
    }
    return `Session started ${activity.data.sessionReference}`;
  };

  const getActivityDescription = (activity: any) => {
    if (activity.type === 'booking') {
      const booking = activity.data as Booking;
      return `${booking.vehiclePlate} at ${booking.parkingSpaceLabel}`;
    }
    const session = activity.data as ParkingSession;
    return `${session.vehiclePlate} at ${session.parkingSpaceLabel}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-600">Latest bookings and sessions</p>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MdAccessTime className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const status = activity.data.status;
            
            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getActivityTitle(activity)}
                    </p>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      getStatusColor(status)
                    )}>
                      {status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate">
                    {getActivityDescription(activity)}
                  </p>
                  
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <MdPerson className="w-3 h-3 mr-1" />
                    <span>{activity.data.userEmail}</span>
                    <span className="mx-2">•</span>
                    <MdAccessTime className="w-3 h-3 mr-1" />
                    <span>{formatDateTime(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all activity →
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;
