import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // 可选：设置静态导出的图像优化
  images: {
    unoptimized: true,
  },
  // 可选：设置静态导出的 basePath
  // basePath: "/your-base-path",
};

export default nextConfig;
