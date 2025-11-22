/** @type {import('next').NextConfig} */
const nextConfig = {
  // 👇 add this line to enable static export
  output: 'export',

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
