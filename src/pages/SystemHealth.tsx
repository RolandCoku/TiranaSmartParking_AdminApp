import React, { useState, useEffect } from 'react';
import { 
  MdRefresh,
  MdWarning,
  MdError,
  MdCheckCircle,
  MdInfo,
  MdWifi,
  MdWifiOff,
  MdAccessTime
} from 'react-icons/md';
import type { SystemHealth as SystemHealthType, SensorStatus } from '../types';
import { formatDateTime } from '../utils';
import apiService from '../services/api';

const SystemHealth: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealthType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedSensor, setSelectedSensor] = useState<SensorStatus | null>(null);

  const fetchSystemHealth = async () => {
    try {
      setIsLoading(true);
      const health = await apiService.getSystemHealth();
      setSystemHealth(health);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching system health:', error);
      // Set empty data when API fails
      setSystemHealth(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemHealth();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE':
      case 'HEALTHY':
        return <MdCheckCircle className="w-5 h-5 text-green-600" />;
      case 'OFFLINE':
        return <MdWifiOff className="w-5 h-5 text-gray-600" />;
      case 'ERROR':
      case 'CRITICAL':
        return <MdError className="w-5 h-5 text-red-600" />;
      case 'WARNING':
        return <MdWarning className="w-5 h-5 text-yellow-600" />;
      default:
        return <MdInfo className="w-5 h-5 text-blue-600" />;
    }
  };


  const getSensorStatusCounts = () => {
    if (!systemHealth) return { online: 0, offline: 0, error: 0 };
    
    return systemHealth.sensorStatus.reduce(
      (counts, sensor) => {
        counts[sensor.status.toLowerCase() as keyof typeof counts]++;
        return counts;
      },
      { online: 0, offline: 0, error: 0 }
    );
  };

  const getErrorCounts = () => {
    if (!systemHealth) return { critical: 0, error: 0, warning: 0, info: 0 };
    
    return systemHealth.systemErrors.reduce(
      (counts, error) => {
        counts[error.level.toLowerCase() as keyof typeof counts]++;
        return counts;
      },
      { critical: 0, error: 0, warning: 0, info: 0 }
    );
  };

  const sensorCounts = getSensorStatusCounts();
  const errorCounts = getErrorCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-600">Monitor system status and sensor health</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchSystemHealth}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <MdRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      {systemHealth ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  {getStatusIcon(systemHealth?.status || 'HEALTHY')}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">System Status</p>
                  <p className="text-2xl font-bold text-gray-900">{systemHealth?.status || 'HEALTHY'}</p>
                  <p className="text-sm text-green-600">All systems operational</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <MdWifi className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Online Sensors</p>
                  <p className="text-2xl font-bold text-gray-900">{sensorCounts.online}</p>
                  <p className="text-sm text-gray-600">
                    {sensorCounts.offline + sensorCounts.error} offline/error
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <MdWarning className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Issues</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {errorCounts.critical + errorCounts.error + errorCounts.warning}
                  </p>
                  <p className="text-sm text-gray-600">
                    {errorCounts.critical} critical, {errorCounts.error} errors
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <MdAccessTime className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Uptime</p>
                  <p className="text-2xl font-bold text-gray-900">99.9%</p>
                  <p className="text-sm text-green-600">Last 30 days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sensor Status */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Sensor Status</h3>
              <p className="text-sm text-gray-600">Real-time status of all parking sensors</p>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading sensor data...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {systemHealth.sensorStatus.map((sensor) => (
                    <div key={sensor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          sensor.status === 'ONLINE' ? 'bg-green-500' : 
                          sensor.status === 'OFFLINE' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">{sensor.name}</p>
                          <p className="text-sm text-gray-600">{sensor.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          sensor.status === 'ONLINE' ? 'text-green-600' : 
                          sensor.status === 'OFFLINE' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {sensor.status}
                        </p>
                        <p className="text-xs text-gray-500">Last seen: {formatDateTime(sensor.lastUpdate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* System Errors */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent System Errors</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {systemHealth.systemErrors.map((error) => (
                  <div key={error.id} className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        error.level === 'CRITICAL' ? 'bg-red-100' : 
                        error.level === 'ERROR' ? 'bg-orange-100' : 'bg-yellow-100'
                      }`}>
                        <MdWarning className={`w-4 h-4 ${
                          error.level === 'CRITICAL' ? 'text-red-600' : 
                          error.level === 'ERROR' ? 'text-orange-600' : 'text-yellow-600'
                        }`} />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{error.message}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          error.level === 'CRITICAL' ? 'bg-red-100 text-red-800' : 
                          error.level === 'ERROR' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {error.level}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{error.source}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatDateTime(error.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* Sensor Details Modal */}
          {selectedSensor && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedSensor.name}</h3>
                  <button
                    onClick={() => setSelectedSensor(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MdError className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Location</p>
                    <p className="text-gray-900">{selectedSensor.location}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <div className="flex items-center mt-1">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        selectedSensor.status === 'ONLINE' ? 'bg-green-500' : 
                        selectedSensor.status === 'OFFLINE' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <span className={`text-sm font-medium ${
                        selectedSensor.status === 'ONLINE' ? 'text-green-600' : 
                        selectedSensor.status === 'OFFLINE' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {selectedSensor.status}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Update</p>
                    <p className="text-gray-900">{formatDateTime(selectedSensor.lastUpdate)}</p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setSelectedSensor(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {selectedSensor.status === 'OFFLINE' && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Restart Sensor
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <MdWarning className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No System Health Data</h3>
            <p className="text-gray-600">Unable to retrieve system health information at the moment.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;