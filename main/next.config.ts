import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fwixzks0fh.ufs.sh',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'pub-d421b0fc5c554a00b338fe82fcc1d645.r2.dev',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'files.bexforte.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'bexforte.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'pub-ab89dd8a7bed45e0bcff5f5be83a59c9.r2.dev',
        pathname: '/**'
      },

    ],
  },
  webpack: (config, { isServer }) => {
    // Handle native modules for @resvg/resvg-js
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@resvg/resvg-js');
    } else {
      // Exclude from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
