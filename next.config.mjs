import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Disable in dev so the service worker doesn't intercept HMR.
  // Also disable unless explicitly opted in via ENABLE_PWA=1 — next-pwa
  // synchronously hashes every file in node_modules during build, which
  // fails on OneDrive / network-mounted source trees. Enable on Vercel
  // (or any standard Linux build) by setting ENABLE_PWA=1.
  disable: process.env.NODE_ENV === "development" || process.env.ENABLE_PWA !== "1",
  register: true,
  // Workbox config — cache static assets + the home shell for offline.
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "cloudinary-images",
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        urlPattern: /^https?:\/\/.*\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static",
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        urlPattern: ({ request, url }) =>
          request.mode === "navigate" && url.pathname === "/",
        handler: "NetworkFirst",
        options: {
          cacheName: "home-shell",
          networkTimeoutSeconds: 3,
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  // Instrumentation hook is only needed when Sentry is wired up. Pulling
  // it in unconditionally adds ~30s to dev cold starts because the Sentry +
  // OpenTelemetry dep graph is huge. Enable by setting SENTRY_DSN.
  experimental: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
    ? { instrumentationHook: true }
    : {},
};

export default withPWA(nextConfig);
