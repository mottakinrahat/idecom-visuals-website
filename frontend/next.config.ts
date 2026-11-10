import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Self-contained server (.next/standalone) so the production Docker image only ships what it needs.
  output: "standalone",
  // npm workspaces: trace dependencies from the monorepo root (node_modules is hoisted there).
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
