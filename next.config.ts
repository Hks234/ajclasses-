import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone is for Docker / `node server.js`. On Vercel it runs after a
  // successful compile and fails packaging, so the deployment never goes live.
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  serverExternalPackages: [
    "mysql2",
    "bcryptjs",
    "nodemailer",
    "razorpay",
    "ffmpeg-static",
    "ffprobe-static",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
