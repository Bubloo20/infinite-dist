/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // AVIF then WebP — typically a third to a half the bytes of the JPEGs.
    formats: ["image/avif", "image/webp"],
    // The photos never change under the same name, so cache the derivatives.
    minimumCacheTTL: 60 * 60 * 24 * 365,
    deviceSizes: [400, 640, 828, 1080, 1280, 1920],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
