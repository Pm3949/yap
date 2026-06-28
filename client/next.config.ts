import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// PWA Configuration
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Dev mode mein service worker band rahega
  register: true,
});

const nextConfig: NextConfig = {
  /* Aapki baki ki settings yahan ayengi */
  reactStrictMode: true,
};

// Config ko PWA ke sath export karo
export default withPWA(nextConfig);