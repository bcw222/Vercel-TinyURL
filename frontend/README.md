# TinyURL 前端应用

这是一个使用 Next.js 构建的 TinyURL 前端应用，支持静态文件部署。

## 功能特性

- 用户注册和登录
- 短链接创建、查看、更新和删除
- 短链接访问统计和详细信息查看
- 个人资料管理

## 技术栈

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React](https://reactjs.org/)

## 开发环境设置

1. 安装依赖：
   ```bash
   npm install
   ```

2. 运行开发服务器：
   ```bash
   npm run dev
   ```

3. 访问应用：
   打开浏览器并访问 `http://localhost:3000`

## 本地运行说明

1. 确保后端 API 服务正在运行（默认端口 3001）
2. 前端开发服务器将在端口 3000 上运行
3. 首次访问应用时，将自动重定向到登录页面
4. 如果没有账户，可以先访问注册页面创建账户

## 环境变量配置

在 `.env.local` 文件中配置以下环境变量：

- `NEXT_PUBLIC_API_BASE_URL`: 后端 API 的基础 URL
- `NEXT_PUBLIC_BASE_URL`: 短链接的基础 URL

## 构建和部署

### 构建静态文件

运行以下命令构建静态文件：

```bash
npm run export
```

这将生成一个 `out` 目录，其中包含所有静态文件。

### 部署

将 `out` 目录中的所有文件上传到您的静态文件托管服务（如 GitHub Pages、Netlify、Vercel 等）。

## 项目结构

```
frontend/
├── src/
│   ├── app/              # Next.js App Router 页面
│   ├── lib/              # 工具函数和 API 客户端
├── public/               # 静态资源
├── .env.local           # 环境变量配置
├── next.config.ts       # Next.js 配置
├── package.json         # 项目依赖和脚本
└── README.md            # 项目说明文档
```

## 注意事项

1. 确保后端 API 服务正在运行并可访问
2. 根据您的部署环境更新 `.env.local` 中的环境变量
3. 如果需要自定义域名，请更新 `next.config.ts` 中的 `basePath` 配置
