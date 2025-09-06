// API 客户端
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://your-api-domain.com/api/v1';

// 用户注册
export async function register(email: string, password: string, name: string) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '注册失败');
  }

  return response.json();
}

// 用户登录
export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '登录失败');
  }

  return response.json();
}

// 获取当前用户信息
export async function getCurrentUser(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/user/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '获取用户信息失败');
  }

  return response.json();
}

// 更新用户信息
export async function updateUserInfo(accessToken: string, name: string, email: string) {
  const response = await fetch(`${API_BASE_URL}/user/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name, email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '更新用户信息失败');
  }

  return response.json();
}

// 获取用户短链接列表
export async function getUserLinks(accessToken: string, page: number = 1, limit: number = 10) {
  const response = await fetch(`${API_BASE_URL}/user/links?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '获取短链接列表失败');
  }

  return response.json();
}

// 刷新访问令牌
export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${refreshToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '刷新访问令牌失败');
  }

  return response.json();
}

// 退出登录
export async function logout(refreshToken: string, accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken, accessToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '退出登录失败');
  }

  // 退出登录操作成功，返回 void
  return;
}

// 获取短链接信息
export async function getLinkInfo(slug: string) {
  const response = await fetch(`${API_BASE_URL}/info/${slug}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '获取短链接信息失败');
  }

  return response.json();
}

// 创建短链接
export async function createShortLink(accessToken: string, originalUrl: string, customStub?: string) {
  const response = await fetch(`${API_BASE_URL}/shorten`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ originalUrl, customStub }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '创建短链接失败');
  }

  return response.json();
}

// 更新短链接
export async function updateShortLink(accessToken: string, slug: string, originalUrl?: string, customStub?: string) {
  const response = await fetch(`${API_BASE_URL}/shorten/${slug}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ originalUrl, customStub }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '更新短链接失败');
  }

  return response.json();
}

// 删除短链接
export async function deleteShortLink(accessToken: string, slug: string) {
  const response = await fetch(`${API_BASE_URL}/${slug}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '删除短链接失败');
  }

  // 删除操作成功，返回 void
  return;
}

// 修改密码
export async function updatePassword(accessToken: string, currentPassword: string, newPassword: string) {
  const response = await fetch(`${API_BASE_URL}/user/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '修改密码失败');
  }

  return response.json();
}