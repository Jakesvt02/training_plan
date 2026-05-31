import type { NextConfig } from 'next'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWAInit = require('next-pwa')

const withPWA = withPWAInit({  // eslint-disable-line
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
})

const nextConfig: NextConfig = {
  transpilePackages: ['@threshold/shared'],
  devIndicators: false,
}

export default withPWA(nextConfig)
