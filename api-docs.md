# TinyURL API 文档

## 概述
本API文档描述了TinyURL前后端分离项目的接口规范。前端通过HTTP请求与后端交互，实现短链接的创建、访问和相关功能。


## 基础信息
- **Base URL**: `https://your-api-domain.com/api/v1`
- **数据格式**: JSON
- **HTTP状态码**: 标准RESTful状态码
- **鉴权**: Bearer Token，所有需要认证的请求必须在HTTP头部包含 `Authorization: Bearer <accessToken>`。
## 用户管理

### 用户注册
- **端点**: `POST /auth/register`
- **描述**: 注册新用户账户；此操作无需携带token
- **请求体**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "name": "User Name"
  }
  ```
- **响应**:
  - 成功 (201):
    ```json
    {
      "user": {
        "id": "123",
        "email": "user@example.com",
        "name": "User Name",
        "createdAt": "2023-01-01T00:00:00Z"
      },
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```

### 用户登录
- **端点**: `POST /auth/login`
- **描述**: 已注册用户要获取访问令牌需要登录；此操作无需携带token
- **请求体**:
  ```json
  {
    "email": "user@example.com",
    "password": "userpassword"
  }
  ```
- **响应**:
  - 成功 (200):
    ```json
    {
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```

### 获取当前用户信息
- **端点**: `GET /user/me`
- **描述**: 获取当前登录用户的详细信息
- **请求头**: `Authorization: Bearer <accessToken>`
- **响应**:
  - 成功 (200):
    ```json
    {
      "id": "123",
      "email": "user@example.com",
      "name": "User Name",
      "createdAt": "2023-01-01T00:00:00Z",
      "lastLoginAt": "2023-01-02T00:00:00Z",
      "shortLinksCount": 15,
      "shortLinksQuota": 85
    }
    ```

### 更新用户信息
- **端点**: `PUT /user/me`
- **描述**: 更新当前用户的个人信息
- **请求头**: `Authorization: Bearer <accessToken>`
- **请求体**:
  ```json
  {
    "name": "Updated Name",
    "email": "newemail@example.com" // 可选任意
  }
  ```
- **响应**:
  - 成功 (200):
    ```json
    {
      "email": "newemail@example.com",
      "name": "Updated Name" // 总是返回全部信息
    }
    ```

### 修改密码
- **端点**: `PUT /user/password`
- **描述**: 更新当前用户的密码
- **请求头**: `Authorization: Bearer <accessToken>`
- **请求体**:
  ```json
  {
    "currentPassword": "currentpassword",
    "newPassword": "newpassword"
  }
  ```
- **响应**:
  - 成功 (200):
    ```json
    {
      "message": "Password updated successfully"
    }
    ```
  - 错误 (400):
    ```json
    {
      "error": "bad_request",
      "message": "Current password is incorrect"
    }
    ```

#### 获取用户短链接列表
- **端点**: `GET /user/links`
- **描述**: 获取当前用户创建的所有短链接
- **请求头**: `Authorization: Bearer <accessToken>`
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)
- **响应**:
  - 成功 (200):
    ```json
    {
      "links": [
        {
          "slug": "abc123",
          "originalUrl": "https://example.com",
          "clickCount": 42,
          "createdAt": "2023-01-01T00:00:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 15,
        "pages": 2
      }
    }
    ```

### 刷新访问令牌
- **端点**: `POST /auth/refresh`
- **描述**: 使用刷新令牌获取新的访问令牌
- **请求头**: `Authorization: Bearer <refreshToken>`
- **响应**:
  - 成功 (200):
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```

### 退出登录
- **端点**: `POST /auth/logout`
- **描述**: 登出当前用户，使其无法再使用刷新令牌；令牌由请求体携带，无需在HTTP头部指定
- **请求体**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
- **响应**:
  - 成功 (204): 无内容

### 获取短链接信息
- **端点**: `GET /info/{slug}`
- **描述**: 获取短链接的详细信息和统计
- **参数**:
  - `slug`: 短链接代码
- **响应**:
  - 成功 (200):
    ```json
    {
      "slug": "abc123",
      "originalUrl": "https://example.com/very/long/url",
      "clickCount": 42,
      "createdAt": "2023-01-01T00:00:00Z",
      "lastAccessedAt": "2023-01-02T00:00:00Z"
    }

## 短链接操作

### 创建短链接
- **端点**: `POST /shorten`
- **描述**: 将长URL转换为短链接
- **请求体**:
  ```json
  {
    "originalUrl": "https://example.com/very/long/url",
    "customStub": "optional-custom-alias" // 可选
  }
  ```
- **响应**:
  - 成功 (201):
    ```json
    {
      "slug": "abc123",
      "originalUrl": "https://example.com/very/long/url"
    }
    ```
  - URL已存在 (200):
    ```json
    {
      "status": "existed",
      "slug": "existed123",
      "originalUrl": "https://example.com/very/long/url"
    }
    ```

### 更新短链接
- **端点**: `PUT /shorten/{slug}`
- **描述**: 更新短链接的原始URL或自定义别名
- **参数**:
  - `slug`: 短链接代码
- **请求头**: `Authorization: Bearer <accessToken>`
- **请求体**:
  ```json
  {
    "originalUrl": "https://new-example.com/updated/url", // 可选
    "customStub": "new-custom-alias" // 可选
  }
  ```
- **响应**:
  - 成功 (200):
    ```json
    {
      "slug": "abc123",
      "originalUrl": "https://new-example.com/updated/url",
      "updatedAt": "2023-01-02T00:00:00Z"
    }
    ```

### 删除短链接
- **端点**: `DELETE /{slug}`
- **描述**: 删除指定的短链接
- **参数**:
  - `slug`: 短链接代码
- **请求头**: `Authorization: Bearer <accessToken>`
- **响应**:
  - 成功 (204): 无内容

### 重定向到原链接
- **端点**: `GET /{slug}`
- **描述**: 通过短码重定向到原始URL；此操作无需携带token
- **参数**:
  - `slug`: 短链接代码
- **响应**:
  - 成功 (302): 重定向到原始URL
  - 错误 (302): 重定向到失败前端页面（环境变量里设置绝对url）


## 错误处理
所有错误响应都遵循以下格式：
```json
{
  "error": "ErrorType",
  "message": "Human-readable error message"
}
```

常见错误码和返回：
- 400: 请求参数错误
  ```json
  {
    "error": "bad_request",
    "message": "The request parameters are invalid"
  }
  ```
- 401: 未授权
  ```json
  {
    "error": "unauthorized",
    "message": "Authentication required"
  }
  ```
- 403: 禁止访问
  ```json
  {
    "error": "forbidden",
    "message": "Access denied"
  }
  ```
- 404: 资源不存在
  ```json
  {
    "error": "not_found",
    "message": "The requested resource does not exist"
  }
  ```
- 409: 冲突
  ```json
  {
    "error": "conflict",
    "message": "The resource already exists"
  }
  ```
- 422: 无法处理的实体
  ```json
  {
    "error": "unprocessable_entity",
    "message": "The request data is syntactically correct but semantically invalid"
  }
  ```
- 429: 请求过于频繁
  ```json
  {
    "error": "too_many_requests",
    "message": "Too many requests, please try again later"
  }
  ```
- 500: 服务器内部错误
  ```json
  {
    "error": "internal_server_error",
    "message": "An internal server error occurred"
  }
