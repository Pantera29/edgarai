/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ENABLE_SMS: process.env.ENABLE_SMS || 'false'
  },
  experimental: {
    webpackBuildWorker: true,
  },
  trailingSlash: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    config.externals = [...config.externals, { 'utf-8-validate': 'commonjs utf-8-validate' }, { 'bufferutil': 'commonjs bufferutil' }];
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

console.log('Next.js config - ENABLE_SMS:', nextConfig.env.ENABLE_SMS);

module.exports = nextConfig;