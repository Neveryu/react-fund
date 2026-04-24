/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/react-fund',
  assetPrefix: '/react-fund/',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
