import React, { useState, useEffect } from 'react';
import { 
  MdRefresh,
  MdBuild,
  MdCheckCircle,
  MdWarning,
  MdError,
  MdAccessTime,
  MdCalendarToday,
  MdPlayArrow,
  MdStop,
  MdSettings
} from 'react-icons/md';
import { formatDateTime, cn } from '../utils';
import apiService from '../services/api';

interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  lastRun?: string;
  nextRun?: string;
  duration?: string;
  result?: string;
}

const Maintenance: React.FC = () => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set());

  const fetchMaintenanceTasks = async () => {
    try {
      setIsLoading(true);
      // Mock data for demo
      const mockTasks: MaintenanceTask[] = [
        {
          id: 'update-expired-bookings',
          name: 'Update Expired Bookings',
          description: 'Mark expired bookings as expired and free up parking spaces',
          status: 'COMPLETED',
          lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
          duration: '2m 15s',
          result: 'Updated 12 expired bookings successfully',
        },
        {
          id: 'update-completed-bookings',
          name: 'Update Completed Bookings',
          description: 'Mark completed bookings and update parking space availability',
          status: 'COMPLETED',
          lastRun: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
          duration: '1m 45s',
          result: 'Updated 8 completed bookings successfully',
        },
        {
          id: 'update-expired-sessions',
          name: 'Update Expired Sessions',
          description: 'Mark expired parking sessions and calculate final billing',
          status: 'COMPLETED',
          lastRun: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 23.5 * 60 * 60 * 1000).toISOString(),
          duration: '3m 20s',
          result: 'Updated 5 expired sessions successfully',
        },
        {
          id: 'update-completed-sessions',
          name: 'Update Completed Sessions',
          description: 'Mark completed parking sessions and finalize billing',
          status: 'COMPLETED',
          lastRun: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 23.75 * 60 * 60 * 1000).toISOString(),
          duration: '2m 10s',
          result: 'Updated 15 completed sessions successfully',
        },
        {
          id: 'cleanup-old-logs',
          name: 'Cleanup Old Logs',
          description: 'Remove log entries older than 30 days',
          status: 'PENDING',
          lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          duration: '5m 30s',
          result: 'Cleaned up 1,247 log entries',
        },
        {
          id: 'backup-database',
          name: 'Database Backup',
          description: 'Create daily backup of the database',
          status: 'FAILED',
          lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
          duration: 'N/A',
          result: 'Backup failed: Insufficient disk space',
        },
      ];
      setTasks(mockTasks);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceTasks();
  }, []);

  const handleRunTask = async (taskId: string) => {
    try {
      setRunningTasks(prev => new Set(prev).add(taskId));
      
      // Update task status to running
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'RUNNING' as const }
          : task
      ));

      // Simulate task execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update task status to completed
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: 'COMPLETED' as const,
              lastRun: new Date().toISOString(),
              duration: '2m 15s',
              result: 'Task completed successfully'
            }
          : task
      ));

      setRunningTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    } catch (error) {
      console.error('Error running task:', error);
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'FAILED' as const }
          : task
      ));
      setRunningTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <MdCheckCircle className="w-5 h-5 text-green-600" />;
      case 'RUNNING':
        return <MdPlayArrow className="w-5 h-5 text-blue-600" />;
      case 'FAILED':
        return <MdError className="w-5 h-5 text-red-600" />;
      case 'PENDING':
        return <MdAccessTime className="w-5 h-5 text-yellow-600" />;
      default:
        return <MdWarning className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStats = () => {
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const failed = tasks.filter(t => t.status === 'FAILED').length;
    const pending = tasks.filter(t => t.status === 'PENDING').length;
    const running = tasks.filter(t => t.status === 'RUNNING').length;
    
    return { completed, failed, pending, running };
  };

  const stats = getTaskStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Maintenance</h1>
          <p className="text-gray-600">Manage automated maintenance tasks and system operations</p>
        </div>
        <button
          onClick={fetchMaintenanceTasks}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <MdRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <MdCheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <MdPlayArrow className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Running</p>
              <p className="text-2xl font-bold text-gray-900">{stats.running}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <MdAccessTime className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <MdError className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Tasks */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Maintenance Tasks</h3>
          <p className="text-sm text-gray-600">Automated tasks that keep the system running smoothly</p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading maintenance tasks...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-lg font-medium text-gray-900">{task.name}</h4>
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            getStatusColor(task.status)
                          )}>
                            {task.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Last Run:</span>
                            <span className="ml-1 text-gray-900">
                              {task.lastRun ? formatDateTime(task.lastRun) : 'Never'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Next Run:</span>
                            <span className="ml-1 text-gray-900">
                              {task.nextRun ? formatDateTime(task.nextRun) : 'Not scheduled'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <span className="ml-1 text-gray-900">{task.duration || 'N/A'}</span>
                          </div>
                        </div>

                        {task.result && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-500">Result:</span>
                            <span className="ml-1 text-sm text-gray-900">{task.result}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {task.status === 'PENDING' && (
                        <button
                          onClick={() => handleRunTask(task.id)}
                          disabled={runningTasks.has(task.id)}
                          className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
                        >
                          <MdPlayArrow className="w-4 h-4 mr-1" />
                          {runningTasks.has(task.id) ? 'Running...' : 'Run Now'}
                        </button>
                      )}
                      {task.status === 'RUNNING' && (
                        <button
                          disabled
                          className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded opacity-50"
                        >
                          <MdPlayArrow className="w-4 h-4 mr-1 animate-spin" />
                          Running...
                        </button>
                      )}
                      <button className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
                        <MdSettings className="w-4 h-4 mr-1" />
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => apiService.updateExpiredBookings()}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MdBuild className="w-5 h-5 mr-2 text-blue-600" />
            <span className="text-sm font-medium">Update Expired Bookings</span>
          </button>
          
          <button
            onClick={() => apiService.updateCompletedBookings()}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MdBuild className="w-5 h-5 mr-2 text-green-600" />
            <span className="text-sm font-medium">Update Completed Bookings</span>
          </button>
          
          <button
            onClick={() => apiService.updateExpiredSessions()}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MdBuild className="w-5 h-5 mr-2 text-yellow-600" />
            <span className="text-sm font-medium">Update Expired Sessions</span>
          </button>
          
          <button
            onClick={() => apiService.updateCompletedSessions()}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MdBuild className="w-5 h-5 mr-2 text-purple-600" />
            <span className="text-sm font-medium">Update Completed Sessions</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
