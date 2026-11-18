/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Vercel Services mode doesn't route /_next/image to the optimizer (it 404'd in production
    // and broke every next/image). Serve originals from /public; they're already web-sized.
    unoptimized: true,
  },
  // Lint is available via `npm run lint`; don't let it block production builds.
  eslint: { ignoreDuringBuilds: true },
  // The legacy Python site lives in /legacy-fastapi-site and must be ignored by the build.
  outputFileTracingExcludes: {
    "*": ["./legacy-fastapi-site/**/*"],
  },
};

// Local dev only: `next dev` doesn't run the Python twin service, so forward /api/twin/* to a
// local uvicorn (TWIN_DEV_AGENT_URL=http://localhost:8080). On Vercel, vercel.json routes it.
if (process.env.NODE_ENV !== "production" && process.env.TWIN_DEV_AGENT_URL) {
  nextConfig.rewrites = async () => [
    { source: "/api/twin/:path*", destination: `${process.env.TWIN_DEV_AGENT_URL}/api/twin/:path*` },
  ];
}

export default nextConfig;
