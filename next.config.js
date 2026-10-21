/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure assets are properly referenced
  assetPrefix: process.env.ASSET_PREFIX || "",

  // Limit static page generation concurrency & increase timeout to prevent
  // process/thread exhaustion (EAGAIN / os error 11) on shared hosting environments
  staticPageGenerationTimeout: 180,

  experimental: {
    serverComponentsExternalPackages: ["@resvg/resvg-js"],
    cpus: 1,
    workerThreads: false,
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

  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/hero-video.mp4",
          destination: "https://geomoneytv.com/hero-video.mp4",
        },
        {
          source: "/uploads/:path*",
          destination: "https://geomoneytv.com/uploads/:path*",
        },
        {
          source: "/favicon.ico",
          destination: "https://geomoneytv.com/favicon.ico",
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
