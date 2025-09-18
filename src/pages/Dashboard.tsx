import React, { useState, useEffect } from 'react';
import { 
  MdLocationOn,
  MdEvent,
  MdAccessTime,
  MdAttachMoney,
  MdTrendingUp,
  MdTrendingDown,
  MdWarning,
  MdRefresh
} from 'react-icons/md';
import StatsCard from '../components/Dashboard/StatsCard';
import OccupancyChart from '../components/Dashboard/OccupancyChart';
import RecentActivity from '../components/Dashboard/RecentActivity';
import type { DashboardStats, OccupancyData, Booking, ParkingSession } from '../types';
import apiService from '../services/api';
import { formatCurrency } from '../utils';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentSessions, setRecentSessions] = useState<ParkingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all dashboard data in parallel
      const [
        statsData,
        occupancyData,
        bookingsData,
        sessionsData
      ] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getOccupancyData(),
        apiService.getBookings(0, 5),
        apiService.getSessions(0, 5)
      ]);

      setStats(statsData);
      setOccupancyData(occupancyData);
      setRecentBookings(bookingsData.content);
      setRecentSessions(sessionsData.content);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty data when API fails
      setStats(null);
      setOccupancyData([]);
      setRecentBookings([]);
      setRecentSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MdRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Parking Spots"
          value={stats?.totalSpots || 0}
          icon={MdLocationOn}
          color="blue"
        />
        <StatsCard
          title="Occupied Spots"
          value={stats?.occupiedSpots || 0}
          change={stats ? Math.round((stats.occupiedSpots / stats.totalSpots) * 100) : 0}
          changeLabel="occupancy rate"
          icon={MdTrendingUp}
          color="green"
        />
        <StatsCard
          title="Available Spots"
          value={stats?.availableSpots || 0}
          icon={MdTrendingDown}
          color="yellow"
        />
        <StatsCard
          title="Today's Revenue"
          value={formatCurrency(stats?.todayRevenue || 0)}
          icon={MdAttachMoney}
          color="purple"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Active Bookings"
          value={stats?.activeBookings || 0}
          icon={MdEvent}
          color="indigo"
        />
        <StatsCard
          title="Active Sessions"
          value={stats?.activeSessions || 0}
          icon={MdAccessTime}
          color="green"
        />
        <StatsCard
          title="Overall Occupancy"
          value={`${stats?.occupancyRate || 0}%`}
          icon={MdLocationOn}
          color="blue"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {occupancyData.length > 0 ? (
          <OccupancyChart data={occupancyData} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center py-12">
              <MdLocationOn className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Occupancy Data</h3>
              <p className="text-gray-600">No parking lot occupancy data available at the moment.</p>
            </div>
          </div>
        )}
        
        {(recentBookings.length > 0 || recentSessions.length > 0) ? (
          <RecentActivity 
            bookings={recentBookings} 
            sessions={recentSessions}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center py-12">
              <MdAccessTime className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
              <p className="text-gray-600">No recent bookings or sessions to display.</p>
            </div>
          </div>
        )}
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">All systems operational</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <MdLocationOn className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Parking Sensors</p>
              <p className="text-xs text-gray-600">All online</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <MdAccessTime className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Payment System</p>
              <p className="text-xs text-gray-600">Operational</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <MdWarning className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Notifications</p>
              <p className="text-xs text-gray-600">Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
