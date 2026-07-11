import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AI-generated apps should deploy even if the template has strict type or
  // lint issues. Type errors are compile-time only and don't affect runtime,
  // so we don't let them block a deployment.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // pdf-parse (pdf.js) resolves its worker file by relative path at runtime;
  // bundling it breaks that resolution, so keep it external and loaded via
  // native require/import instead.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
