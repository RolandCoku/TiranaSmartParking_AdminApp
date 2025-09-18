import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Sessions from './pages/Sessions';
import Rates from './pages/Rates';
import Analytics from './pages/Analytics';
import SystemHealth from './pages/SystemHealth';
import ParkingLots from './pages/ParkingLots';
import Users from './pages/Users';
import RoleManagement from './pages/RoleManagement';
import VehicleManagement from './pages/VehicleManagement';
import Maintenance from './pages/Maintenance';
import Settings from './pages/Settings';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="parking-lots" element={<ParkingLots />} />
            <Route path="rates" element={<Rates />} />
            <Route path="users" element={<Users />} />
            <Route path="role-management" element={<RoleManagement />} />
            <Route path="vehicle-management" element={<VehicleManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="system-health" element={<SystemHealth />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
