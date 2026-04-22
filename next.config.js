/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure assets are properly referenced
  assetPrefix: process.env.ASSET_PREFIX || "",

  experimental: {
    serverComponentsExternalPackages: ["@resvg/resvg-js"],
  },

  // Generate source maps in production for debugging
  productionBrowserSourceMaps: false,

  // Optimize builds
  compress: true,

  // React strict mode
  reactStrictMode: true,

  // Ensure trailing slashes if needed
  trailingSlash: false,

  // Image optimization
  images: {
    unoptimized: false,
    domains: ["geomoneytv.com", "www.geomoneytv.com"],
  },
};

module.exports = nextConfig;
