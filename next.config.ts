import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  
async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};
export default nextConfig;
