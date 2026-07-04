/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Lint is available via `npm run lint`; don't let it block production builds.
  eslint: { ignoreDuringBuilds: true },
  // The legacy Python site lives in /legacy-fastapi-site and must be ignored by the build.
  outputFileTracingExcludes: {
    "*": ["./legacy-fastapi-site/**/*"],
  },
};

export default nextConfig;
