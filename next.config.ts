import type { NextConfig } from "next";
import path from "node:path";

// Allow images from ligneous-frontend (set NEXT_PUBLIC_LIGNOUS_FRONTEND_URL)
const ligneousUrl = process.env.NEXT_PUBLIC_LIGNOUS_FRONTEND_URL;
const remotePatterns: Array<{ protocol: "http" | "https"; hostname: string; port?: string; pathname: string }> = [
  { protocol: "http", hostname: "localhost", port: "4000", pathname: "/**" },
];
if (ligneousUrl) {
  try {
    const u = new URL(ligneousUrl);
    const proto = u.protocol.replace(":", "") as "http" | "https";
    if (proto === "http" || proto === "https") {
      remotePatterns.push({
        protocol: proto,
        hostname: u.hostname,
        ...(u.port && { port: u.port }),
        pathname: "/**",
      });
    }
  } catch {
    // Invalid URL, skip
  }
}

const nextConfig: NextConfig = {
  transpilePackages: ["@ligneous/prisma", "konva", "react-konva"],
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  outputFileTracingRoot: path.join(__dirname, ".."),
  images: { remotePatterns },
  /* config options here */
  async headers() {
    return [
      // Static assets: immutable, long cache (hashed filenames change per build)
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
