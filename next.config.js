/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', 'puppeteer'],
  },
  // 增加 API 路由的超时时间
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '4mb',
    },
    externalResolver: true,
  },
};

export default nextConfig;
