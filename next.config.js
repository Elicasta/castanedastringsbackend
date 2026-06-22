/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '4mb' }, // signature images, mood board uploads later
  },
};

module.exports = nextConfig;
