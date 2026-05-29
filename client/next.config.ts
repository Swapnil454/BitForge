import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api';
    const socketBackendUrl = apiUrl.replace('/api', '/socket.io');
    return [
      {
        source: '/socket.io',
        destination: socketBackendUrl,
      },
      {
        source: '/socket.io/:path*',
        destination: `${socketBackendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
