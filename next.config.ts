import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.ptocdn.net",
        pathname: "/images/eventos/**",
      },
    ],
  },
};

export default nextConfig;
