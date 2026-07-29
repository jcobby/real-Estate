import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // keep the dev-tools badge away from the bottom-left demo role switcher
  devIndicators: { position: "bottom-right" },
  images: {
    // The live backend returns listing/material images from arbitrary hosts (some
    // placeholder hosts that don't resolve). Skip the Next image optimizer so a
    // broken remote URL just shows a broken <img> instead of flooding the server
    // with failing optimizer fetches. Allow any remote host for completeness.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default withNextIntl(nextConfig);
