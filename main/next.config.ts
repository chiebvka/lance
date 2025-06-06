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
      }
    ],
  },
};

export default nextConfig;
