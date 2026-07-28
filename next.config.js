/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['s0.wp.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/:path*`, // Proxy to Express backend stripping /api prefix
      },
    ];
  },
};

module.exports = nextConfig;
