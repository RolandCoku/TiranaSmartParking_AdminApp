import React, { useState, useEffect } from 'react';
import { 
  MdRefresh,
  MdTrendingUp,
  MdTrendingDown,
  MdAttachMoney,
  MdAccessTime,
  MdLocationOn,
  MdPeople,
  MdCalendarToday,
  MdDownload,
  MdBarChart
} from 'react-icons/md';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { AnalyticsData, OccupancyTrend, RevenueData, PeakHourData, UserActivityData } from '../types';
import { formatCurrency, formatDate, cn } from '../utils';
import apiService from '../services/api';

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'occupancy' | 'revenue' | 'users'>('occupancy');

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const data = await apiService.getAnalyticsData(
        startDate.toISOString(),
        endDate.toISOString()
      );
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Set empty data when API fails
      setAnalyticsData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const getTotalRevenue = () => {
    if (!analyticsData) return 0;
    return analyticsData.revenueData.reduce((sum, day) => sum + day.revenue, 0);
  };

  const getTotalBookings = () => {
    if (!analyticsData) return 0;
    return analyticsData.revenueData.reduce((sum, day) => sum + day.bookings, 0);
  };

  const getTotalSessions = () => {
    if (!analyticsData) return 0;
    return analyticsData.revenueData.reduce((sum, day) => sum + day.sessions, 0);
  };

  const getAverageOccupancy = () => {
    if (!analyticsData) return 0;
    const total = analyticsData.occupancyTrends.reduce((sum, day) => sum + day.occupancyRate, 0);
    return Math.round(total / analyticsData.occupancyTrends.length);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const vehicleTypeData = [
    { name: 'Car', value: 65, color: '#3b82f6' },
    { name: 'Motorcycle', value: 20, color: '#10b981' },
    { name: 'Truck', value: 10, color: '#f59e0b' },
    { name: 'Bus', value: 5, color: '#ef4444' },
  ];

  const userGroupData = [
    { name: 'Public', value: 45, color: '#3b82f6' },
    { name: 'Resident', value: 25, color: '#10b981' },
    { name: 'Student', value: 20, color: '#f59e0b' },
    { name: 'Staff', value: 10, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive insights into parking operations</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={fetchAnalyticsData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <MdRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <MdDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <MdAttachMoney className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalRevenue())}</p>
              <p className="text-sm text-green-600 flex items-center">
                <MdTrendingUp className="w-4 h-4 mr-1" />
                +12.5% from last period
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <MdLocationOn className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Occupancy</p>
              <p className="text-2xl font-bold text-gray-900">{getAverageOccupancy()}%</p>
              <p className="text-sm text-green-600 flex items-center">
                <MdTrendingUp className="w-4 h-4 mr-1" />
                +5.2% from last period
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <MdCalendarToday className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalBookings()}</p>
              <p className="text-sm text-green-600 flex items-center">
                <MdTrendingUp className="w-4 h-4 mr-1" />
                +8.7% from last period
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <MdAccessTime className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalSessions()}</p>
              <p className="text-sm text-red-600 flex items-center">
                <MdTrendingDown className="w-4 h-4 mr-1" />
                -2.1% from last period
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'occupancy', label: 'Occupancy Trends', icon: MdLocationOn },
              { id: 'revenue', label: 'Revenue Analysis', icon: MdAttachMoney },
              { id: 'users', label: 'User Activity', icon: MdPeople },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMetric(tab.id as any)}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2',
                  selectedMetric === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading analytics...</span>
            </div>
          ) : analyticsData ? (
            <>
              {/* Occupancy Trends */}
              {selectedMetric === 'occupancy' && (
                <div className="space-y-6">
                  <div className="h-80">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupancy Trends</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.occupancyTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatDate(value, 'MMM dd')}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          label={{ value: 'Occupancy %', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                          labelFormatter={(value) => formatDate(value, 'MMM dd, yyyy')}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="occupancyRate" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Occupancy Rate (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-64">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.peakHours}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                          />
                          <Bar dataKey="occupancyRate" fill="#3b82f6" name="Occupancy Rate (%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-64">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Types</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={vehicleTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {vehicleTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Analysis */}
              {selectedMetric === 'revenue' && analyticsData && (
                <div className="space-y-6">
                  <div className="h-80">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatDate(value, 'MMM dd')}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          label={{ value: 'Revenue (ALL)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                          labelFormatter={(value) => formatDate(value, 'MMM dd, yyyy')}
                          formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="#10b981" name="Daily Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-64">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings vs Sessions</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => formatDate(value, 'MMM dd')}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                            labelFormatter={(value) => formatDate(value, 'MMM dd, yyyy')}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={2} name="Bookings" />
                          <Line type="monotone" dataKey="sessions" stroke="#f59e0b" strokeWidth={2} name="Sessions" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-64">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">User Groups</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={userGroupData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {userGroupData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* User Activity */}
              {selectedMetric === 'users' && analyticsData && (
                <div className="space-y-6">
                  <div className="h-80">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity Trends</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.userActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatDate(value, 'MMM dd')}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                          labelFormatter={(value) => formatDate(value, 'MMM dd, yyyy')}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="newUsers" stroke="#3b82f6" strokeWidth={2} name="New Users" />
                        <Line type="monotone" dataKey="activeUsers" stroke="#10b981" strokeWidth={2} name="Active Users" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-64">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.userActivity}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => formatDate(value, 'MMM dd')}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                            labelFormatter={(value) => formatDate(value, 'MMM dd, yyyy')}
                          />
                          <Legend />
                          <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" />
                          <Bar dataKey="sessions" fill="#f59e0b" name="Sessions" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-64">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours Revenue</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.peakHours}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Avg Revenue (ALL)', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                            formatter={(value) => [formatCurrency(value as number), 'Avg Revenue']}
                          />
                          <Bar dataKey="averageRevenue" fill="#10b981" name="Average Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <MdBarChart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
                <p className="text-gray-600">No analytics data available for the selected time period.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
