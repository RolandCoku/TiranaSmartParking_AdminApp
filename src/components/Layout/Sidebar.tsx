import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MdDashboard,
  MdEvent,
  MdAccessTime,
  MdAttachMoney,
  MdPeople,
  MdLocationOn,
  MdSettings,
  MdBarChart,
  MdWarning,
  MdBuild,
  MdLogout,
  MdPerson,
  MdSecurity,
  MdDirectionsCar
} from 'react-icons/md';
import { cn } from '../../utils';
import { useAuth, usePermissions } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout, isLoading } = useAuth();
  const permissions = usePermissions();

  console.log('📱 Sidebar render:', {
    isLoading,
    user: user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    } : null,
    permissions: permissions
  });

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: MdDashboard,
      permission: true,
    },
    {
      name: 'Bookings',
      href: '/bookings',
      icon: MdEvent,
      permission: permissions.canManageBookings,
    },
    {
      name: 'Sessions',
      href: '/sessions',
      icon: MdAccessTime,
      permission: permissions.canManageSessions,
    },
    {
      name: 'Parking Lots',
      href: '/parking-lots',
      icon: MdLocationOn,
      permission: permissions.canManageSpaces,
    },
    {
      name: 'Rate Management',
      href: '/rates',
      icon: MdAttachMoney,
      permission: permissions.canManageRates,
    },
    {
      name: 'Users',
      href: '/users',
      icon: MdPeople,
      permission: permissions.canManageUsers,
    },
    {
      name: 'Vehicle Management',
      href: '/vehicle-management',
      icon: MdDirectionsCar,
      permission: permissions.canManageUsers, // Using canManageUsers for now, could be more specific
    },
    {
      name: 'Role Management',
      href: '/role-management',
      icon: MdSecurity,
      permission: permissions.canManageUsers, // Using canManageUsers for now, could be more specific
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: MdBarChart,
      permission: permissions.canViewAnalytics,
    },
    {
      name: 'System Health',
      href: '/system-health',
      icon: MdWarning,
      permission: permissions.canViewSystemHealth,
    },
    {
      name: 'Maintenance',
      href: '/maintenance',
      icon: MdBuild,
      permission: permissions.canRunMaintenance,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: MdSettings,
      permission: true,
    },
  ];

  const filteredItems = isLoading || user?.role === UserRole.ADMIN 
    ? navigationItems 
    : navigationItems.filter(item => item.permission);

  console.log('📱 Sidebar filtering:', {
    isLoading,
    userRole: user?.role,
    isAdmin: user?.role === UserRole.ADMIN,
    totalItems: navigationItems.length,
    filteredItems: filteredItems.length,
    filteredItemNames: filteredItems.map(item => item.name)
  });

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Parking Admin</span>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MdPerson className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  onClick={onClose}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-700 rounded-lg hover:bg-red-50 transition-colors"
            >
              <MdLogout className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
