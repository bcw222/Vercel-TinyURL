'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserLinks, createShortLink, deleteShortLink } from '@/lib/api';

interface Link {
  slug: string;
  originalUrl: string;
  clickCount: number;
  createdAt: string;
}

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [customStub, setCustomStub] = useState('');
  const [creating, setCreating] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchLinks = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          logout();
          return;
        }

        const data = await getUserLinks(accessToken);
        setLinks(data.links);
      } catch (err: any) {
        setError(err.message || '获取短链接列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, [user, router, logout]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        logout();
        return;
      }

      const data = await createShortLink(accessToken, originalUrl, customStub || undefined);
      setLinks([{ ...data, clickCount: 0, createdAt: new Date().toISOString() }, ...links]);
      setOriginalUrl('');
      setCustomStub('');
    } catch (err: any) {
      setError(err.message || '创建短链接失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteLink = async (slug: string) => {
    if (!confirm('确定要删除这个短链接吗？')) {
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        logout();
        return;
      }

      await deleteShortLink(accessToken, slug);
      // 重新获取链接列表以确保页面刷新
      const data = await getUserLinks(accessToken);
      setLinks(data.links);
    } catch (err: any) {
      setError(err.message || '删除短链接失败');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
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
                <h1 className="text-xl font-bold">短链接管理</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                返回仪表板
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-4">
            <h2 className="text-2xl font-bold mb-4">创建短链接</h2>
            <form onSubmit={handleCreateLink} className="mb-8">
              {error && (
                <div className="rounded-md bg-red-50 p-4 mb-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="originalUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    原始链接
                  </label>
                  <input
                    type="url"
                    id="originalUrl"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://example.com"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="customStub" className="block text-sm font-medium text-gray-700 mb-1">
                    自定义短链接 (可选)
                  </label>
                  <input
                    type="text"
                    id="customStub"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="可选"
                    value={customStub}
                    onChange={(e) => setCustomStub(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {creating ? '创建中...' : '创建短链接'}
                </button>
              </div>
            </form>

            <h2 className="text-2xl font-bold mb-4">我的短链接</h2>
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">您还没有创建任何短链接</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        短链接
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        原始链接
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        点击次数
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        创建时间
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {links.map((link) => (
                      <tr key={link.slug}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-indigo-600 font-medium">
                            {process.env.NEXT_PUBLIC_API_BASE_URL || 'https://your-domain.com'}/{link.slug}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {link.originalUrl}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{link.clickCount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(link.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => router.push(`/dashboard/links/${link.slug}`)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            查看
                          </button>
                          <button
                            onClick={() => handleDeleteLink(link.slug)}
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}