import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'tesseract.js', '@napi-rs/canvas'],
};

export default nextConfig;
