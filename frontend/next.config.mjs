/** @type {import('next').NextConfig} */
const backendBaseRaw = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const backendApiBase = backendBaseRaw.endsWith("/api")
  ? backendBaseRaw
  : `${backendBaseRaw.replace(/\/$/, "")}/api`;

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendApiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
