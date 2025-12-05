import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
});

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
  // Turbopack configuration for Next.js 16
  turbopack: {},
};

export default withBundleAnalyzer(nextConfig);
