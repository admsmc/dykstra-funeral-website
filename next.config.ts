import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: [
    '@dykstra/api',
    '@dykstra/application',
    '@dykstra/domain',
    '@dykstra/infrastructure',
    '@dykstra/shared',
    '@dykstra/ui',
  ],
};

export default nextConfig;
