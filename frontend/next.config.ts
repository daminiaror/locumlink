import type { NextConfig } from 'next';

/**
 * IMPORTANT: Delete next.config.mjs — Next.js errors if both .ts and .mjs exist.
 * next.js already auto-loads frontend/.env.local so manual dotenv is not needed here.
 * Root .env values are loaded by the backend. Only NEXT_PUBLIC_* keys need to be in
 * frontend/.env.local which Next.js handles automatically.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
