import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@threshold/shared'],
  devIndicators: false,
}

export default nextConfig
