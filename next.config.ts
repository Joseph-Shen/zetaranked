import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.externals = [...(config.externals || []), { bufferutil: 'bufferutil', 'utf-8-validate': 'utf-8-validate' }];
    return config;
  },
  reactStrictMode: false,
  // Enable WebSocket support
  experimental: {},
  serverExternalPackages: ['socket.io', 'socket.io-client'],
};

export default nextConfig;
