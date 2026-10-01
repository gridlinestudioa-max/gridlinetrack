import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tenant sites are served from subdomains in development too
  // (e.g. thunder-valley.localhost:3000 or thunder-valley.lvh.me:3000).
  allowedDevOrigins: ["*.localhost", "lvh.me", "*.lvh.me"],
  // Flyer fonts are read from disk at request time; make sure they ship with the server.
  outputFileTracingIncludes: {
    "/admin/t/[trackId]/events/[eventId]/flyer": ["./assets/fonts/**/*"],
  },
  experimental: {
    serverActions: {
      // Logo uploads go through a Server Action; storage caps files at 5 MB.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
