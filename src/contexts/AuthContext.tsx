import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthContextType } from '../types';
import { UserRole } from '../types';
import apiService from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  };

  // Extract user role from JWT token authorities
  const getUserRoleFromToken = (token: string): UserRole => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const authorities = payload.authorities || [];
      
      console.log('🔍 JWT Token Analysis:', {
        token: token.substring(0, 50) + '...',
        payload: payload,
        authorities: authorities,
        sub: payload.sub,
        exp: payload.exp,
        iat: payload.iat
      });
      
      // Check for admin role
      if (authorities.includes('ROLE_ADMIN')) {
        console.log('✅ User role determined: ADMIN');
        return UserRole.ADMIN;
      }
      // Check for manager role
      if (authorities.includes('ROLE_MANAGER')) {
        console.log('✅ User role determined: MANAGER');
        return UserRole.MANAGER;
      }
      // Default to personnel
      console.log('✅ User role determined: PERSONNEL (default)');
      return UserRole.PERSONNEL;
    } catch (error) {
      console.error('❌ Error parsing JWT token:', error);
      console.log('✅ User role determined: PERSONNEL (fallback)');
      return UserRole.PERSONNEL;
    }
  };

  // Create user object from token
  const createUserFromToken = (token: string): User => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = getUserRoleFromToken(token);
      
      const user = {
        id: 1, // This should come from the backend
        email: payload.sub, // Using username as email for now
        firstName: 'Admin', // This should come from the backend
        lastName: 'User', // This should come from the backend
        role: userRole,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log('👤 User created from token:', user);
      return user;
    } catch (error) {
      console.error('❌ Error creating user from token:', error);
      // Fallback user if token parsing fails
      const fallbackUser = {
        id: 1,
        email: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      console.log('👤 Fallback user created:', fallbackUser);
      return fallbackUser;
    }
  };

  // Cookie utility methods
  const setCookie = (name: string, value: string, days: number = 30): void => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    const isSecure = window.location.protocol === 'https:';
    const secureFlag = isSecure ? ';secure' : '';
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;samesite=lax${secureFlag}`;
  };

  const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const deleteCookie = (name: string): void => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  };

  // Refresh access token using refresh token
  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const refreshToken = getCookie('refreshToken');
      console.log('🔄 Attempting token refresh...', { refreshToken: refreshToken ? 'present' : 'missing' });
      
      if (!refreshToken) {
        console.log('❌ No refresh token found');
        return null;
      }

      const response = await apiService.refreshToken(refreshToken);
      console.log('✅ Token refresh successful:', {
        accessToken: response.accessToken.substring(0, 50) + '...',
        refreshToken: response.refreshToken.substring(0, 50) + '...',
        tokenType: response.tokenType,
        accessTokenExpiresIn: response.accessTokenExpiresIn,
        refreshTokenExpiresIn: response.refreshTokenExpiresIn
      });
      
      setCookie('authToken', response.accessToken, 1); // 1 day for access token
      setCookie('refreshToken', response.refreshToken, 30); // 30 days for refresh token
      return response.accessToken;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      deleteCookie('authToken');
      deleteCookie('refreshToken');
      deleteCookie('rememberMe');
      // Redirect to login if refresh fails (only if not already on login page)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 Initializing authentication...');
      const token = getCookie('authToken');
      const refreshToken = getCookie('refreshToken');
      
      console.log('🍪 Cookies found:', {
        authToken: token ? 'present' : 'missing',
        refreshToken: refreshToken ? 'present' : 'missing'
      });
      
      if (!token) {
        console.log('❌ No auth token found, user not authenticated');
        setIsLoading(false);
        return;
      }

      console.log('🔍 Checking token expiration...');
      const isExpired = isTokenExpired(token);
      console.log('⏰ Token expired:', isExpired);

      // Check if access token is expired
      if (isExpired) {
        console.log('🔄 Token is expired, attempting refresh...');
        if (refreshToken) {
          // Try to refresh the token
          const newToken = await refreshAccessToken();
          if (newToken) {
            console.log('✅ Token refreshed, getting user info...');
            // Token refreshed successfully, get user info
            try {
              const userInfo = await apiService.getCurrentUser();
              console.log('👤 User info from API:', userInfo);
              
              // Transform API response to match our User type
              const transformedUser: User = {
                id: userInfo.id,
                email: userInfo.email,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                role: userInfo.roles && userInfo.roles.length > 0 ? userInfo.roles[0].name as UserRole : UserRole.PERSONNEL,
                isActive: userInfo.isActive || true,
                createdAt: userInfo.createdAt,
                updatedAt: userInfo.updatedAt,
              };
              
              console.log('👤 Transformed user:', transformedUser);
              setUser(transformedUser);
            } catch (error) {
              console.error('❌ Failed to get user info after token refresh:', error);
              // Fallback: create user from token
              const userFromToken = createUserFromToken(newToken);
              setUser(userFromToken);
            }
          } else {
            console.log('❌ Token refresh failed, clearing auth and redirecting to login');
            // Token refresh failed, clear auth and redirect to login
            deleteCookie('authToken');
            deleteCookie('refreshToken');
            deleteCookie('rememberMe');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            return;
          }
        } else {
          console.log('❌ No refresh token, clearing auth and redirecting to login');
          // No refresh token, clear auth and redirect to login
          deleteCookie('authToken');
          deleteCookie('refreshToken');
          deleteCookie('rememberMe');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return;
        }
      } else {
        console.log('✅ Token is still valid, getting user info...');
        // Token is still valid, get user info
        try {
          const userInfo = await apiService.getCurrentUser();
          console.log('👤 User info from API:', userInfo);
          
          // Transform API response to match our User type
          const transformedUser: User = {
            id: userInfo.id,
            email: userInfo.email,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            role: userInfo.roles && userInfo.roles.length > 0 ? userInfo.roles[0].name as UserRole : UserRole.PERSONNEL,
            isActive: userInfo.isActive || true,
            createdAt: userInfo.createdAt,
            updatedAt: userInfo.updatedAt,
          };
          
          console.log('👤 Transformed user:', transformedUser);
          setUser(transformedUser);
        } catch (error) {
          console.error('❌ Failed to get user info:', error);
          // Fallback: create user from token
          const userFromToken = createUserFromToken(token);
          setUser(userFromToken);
        }
      }
      
      console.log('🏁 Authentication initialization complete');
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string, rememberMe = false): Promise<void> => {
    try {
      console.log('🔐 Attempting login...', { username, rememberMe });
      const response = await apiService.login(username, password);
      
      console.log('✅ Login successful:', {
        accessToken: response.accessToken.substring(0, 50) + '...',
        refreshToken: response.refreshToken.substring(0, 50) + '...',
        tokenType: response.tokenType,
        accessTokenExpiresIn: response.accessTokenExpiresIn,
        refreshTokenExpiresIn: response.refreshTokenExpiresIn
      });
      
      // Store tokens in cookies
      setCookie('authToken', response.accessToken, 1); // 1 day for access token
      setCookie('refreshToken', response.refreshToken, 30); // 30 days for refresh token
      
      // Store remember me preference
      if (rememberMe) {
        setCookie('rememberMe', 'true', 30);
        console.log('💾 Remember me preference saved');
      } else {
        deleteCookie('rememberMe');
        console.log('💾 Remember me preference cleared');
      }
      
      // Get user info from token or make a separate API call
      try {
        console.log('👤 Getting user info from API...');
        const userInfo = await apiService.getCurrentUser();
        console.log('👤 User info from API:', userInfo);
        
        // Transform API response to match our User type
        const transformedUser: User = {
          id: userInfo.id,
          email: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          role: userInfo.roles && userInfo.roles.length > 0 ? userInfo.roles[0].name as UserRole : UserRole.PERSONNEL,
          isActive: userInfo.isActive || true,
          createdAt: userInfo.createdAt,
          updatedAt: userInfo.updatedAt,
        };
        
        console.log('👤 Transformed user:', transformedUser);
        setUser(transformedUser);
      } catch (error) {
        console.error('❌ Failed to get user info after login:', error);
        // Fallback: create user from token
        const userFromToken = createUserFromToken(response.accessToken);
        setUser(userFromToken);
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const logout = (): void => {
    setUser(null);
    deleteCookie('authToken');
    deleteCookie('refreshToken');
    deleteCookie('rememberMe');
  };


  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Permission hook
export const usePermissions = () => {
  const { user } = useAuth();
  
  const permissions = {
    canManageUsers: user?.role === UserRole.ADMIN,
    canManageRates: user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER,
    canManageSpaces: user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER,
    canViewAnalytics: user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER,
    canManageBookings: true, // All roles can manage bookings
    canManageSessions: true, // All roles can manage sessions
    canViewSystemHealth: user?.role === UserRole.ADMIN,
    canRunMaintenance: user?.role === UserRole.ADMIN,
  };

  console.log('🔐 Permissions calculated:', {
    userRole: user?.role,
    permissions: permissions
  });

  return permissions;
};
