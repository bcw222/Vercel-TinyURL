'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/api';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          router.push('/auth/login');
          return;
        }

        const userData = await getCurrentUser(accessToken);
        setUser(userData);
      } catch (err: any) {
        setError(err.message || '获取用户信息失败');
        // 如果令牌过期，尝试刷新令牌
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // 这里可以实现刷新令牌的逻辑
          // 为了简化，我们直接跳转到登录页面
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const accessToken = localStorage.getItem('accessToken');
      if (refreshToken && accessToken) {
        await logout(refreshToken, accessToken);
      }
    } catch (err) {
      console.error('退出登录时出错:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      router.push('/auth/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">错误!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">TinyURL 仪表板</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-4">
            <h2 className="text-2xl font-bold mb-4">欢迎, {user?.name}!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">用户信息</h3>
                <dl className="mt-4 space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">邮箱</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">注册时间</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">最后登录</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">短链接数量</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.shortLinksCount || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">剩余配额</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.shortLinksQuota || 0}</dd>
                  </div>
                </dl>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">功能导航</h3>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => router.push('/dashboard/links')}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    管理短链接
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/profile')}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    编辑个人资料
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}