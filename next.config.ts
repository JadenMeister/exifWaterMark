import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // Reverted: development mode causes infinite recompilation loops
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSerwist(nextConfig);
