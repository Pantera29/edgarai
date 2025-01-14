/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  basePath: "/edgarai",
  assetPrefix: "/edgarai/",
  trailingSlash: true
}

module.exports = nextConfig