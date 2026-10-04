import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is the default in Next.js 16
  // No webpack config needed — Tesseract.js works fine client-side via dynamic import
  turbopack: {},
};

export default nextConfig;
