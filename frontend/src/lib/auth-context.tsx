'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, refreshAccessToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt: string;
  shortLinksCount: number;
  shortLinksQuota: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken) {
        try {
          const userData = await getCurrentUser(accessToken);
          setUser(userData);
        } catch (err: any) {
          // 如果令牌过期，尝试刷新令牌
          if (refreshToken) {
            try {
              const data = await refreshAccessToken(refreshToken);
              localStorage.setItem('accessToken', data.accessToken);
              const userData = await getCurrentUser(data.accessToken);
              setUser(userData);
            } catch (refreshError) {
              // 刷新令牌也失败，清除本地存储
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              // 不要自动重定向到登录页面，而是让用户手动登录
            }
          } else {
            // 没有刷新令牌，清除本地存储
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            // 不要自动重定向到登录页面，而是让用户手动登录
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [router]);

  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    // 获取用户信息并设置用户状态
    getCurrentUser(accessToken).then(setUser).catch(console.error);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/auth/login');
  };

  const refreshUser = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        const userData = await getCurrentUser(accessToken);
        setUser(userData);
      }
    } catch (err: any) {
      setError(err.message || '获取用户信息失败');
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}