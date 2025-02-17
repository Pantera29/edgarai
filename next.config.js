/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: "/edgarai",
  assetPrefix: "/edgarai/",
  images: {
    unoptimized: true
  },
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