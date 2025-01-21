/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  basePath: "/edgarai",
  assetPrefix: "/edgarai/",
  trailingSlash: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/configuracion',
        permanent: true,
      }
    ];
  }
};

module.exports = nextConfig;