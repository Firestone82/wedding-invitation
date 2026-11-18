import { execSync } from "node:child_process";
import type { NextConfig } from "next";

/**
 * Where the site lives: "" for a domain root, "/WeddingInvitation" for a GitHub Pages project site.
 * The deploy workflow sets BASE_PATH automatically.
 */
const basePath = (process.env.BASE_PATH ?? "").replace(/\/+$/, "");

/** Stamped into the links of photos, music and cards so browsers and CDNs fetch fresh files after each deploy. */
function siteVersion(): string {
  if (process.env.SITE_VERSION) {
    return process.env.SITE_VERSION.slice(0, 12);
  }
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return Date.now().toString(36);
  }
}

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_VERSION: siteVersion(),
  },
};

export default nextConfig;
