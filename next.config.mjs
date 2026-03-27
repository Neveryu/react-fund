/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  basePath: '/react-fund',
  assetPrefix: '/react-fund/',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
