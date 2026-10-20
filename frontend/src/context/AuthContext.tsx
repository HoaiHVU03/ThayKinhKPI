// frontend/src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
  canAccessClass: (classId: number) => boolean;
  canAccessRoom: (roomId: number) => boolean;
  canAccessFloor: (floorNumber: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('thaykinh_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('thaykinh_auth_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyMe = async () => {
      if (token) {
        try {
          const freshUser = await api.get<User>('/auth/me');
          setUser(freshUser);
          localStorage.setItem('thaykinh_auth_user', JSON.stringify(freshUser));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyMe();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { username, password });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('thaykinh_auth_token', res.token);
    localStorage.setItem('thaykinh_auth_user', JSON.stringify(res.user));
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem('thaykinh_auth_token');
    localStorage.removeItem('thaykinh_auth_user');
  };

  const hasRole = (roles: Role[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const canAccessClass = (classId: number): boolean => {
    if (!user) return false;
    if (['admin', 'dorm_manager', 'youth_union'].includes(user.role)) return true;
    if (user.role === 'homeroom_teacher') {
      return user.scopes?.some(s => s.scope_type === 'class' && s.scope_id === classId) ?? false;
    }
    return false;
  };

  const canAccessRoom = (roomId: number): boolean => {
    if (!user) return false;
    if (['admin', 'dorm_manager'].includes(user.role)) return true;
    if (user.role === 'room_leader') {
      return user.scopes?.some(s => s.scope_type === 'room' && s.scope_id === roomId) ?? false;
    }
    return false;
  };

  const canAccessFloor = (floorNumber: number): boolean => {
    if (!user) return false;
    if (['admin', 'dorm_manager'].includes(user.role)) return true;
    if (user.role === 'floor_leader') {
      return user.scopes?.some(s => s.scope_type === 'floor' && s.scope_id === floorNumber) ?? false;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, login, logout, hasRole,
      canAccessClass, canAccessRoom, canAccessFloor
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
