/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  compress: false,
  swcMinify: true,
  experimental: {
    concurrentFeatures: true,
    runtime: "nodejs",
    workerThreads: true,
  },
};

module.exports = nextConfig;
