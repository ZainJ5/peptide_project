/** @type {import('next').NextConfig} */
const rawBackend =
	process.env.BACKEND_IMAGE_BASE_URL ||
	process.env.NEXT_PUBLIC_BACKEND_IMAGE_BASE_URL ||
	process.env.BACKEND_BASE_URL ||
	"http://139.59.34.214";

const backendOrigin = rawBackend.replace(/\/$/, "").replace(/\/api$/, "");

const nextConfig = {
	images: {
		formats: ["image/avif", "image/webp"],
		qualities: [60, 75],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920],
		imageSizes: [16, 32, 48, 64, 96, 128, 256],
	},

	compiler: {
		removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
	},

	experimental: {
		optimizePackageImports: [
			"@mui/icons-material",
			"@mui/material",
			"lucide-react",
			"recharts",
			"date-fns",
			"framer-motion",
		],
	},

	async headers() {
		return [
			{
				source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)",
				headers: [
					{ key: "Cache-Control", value: "public, max-age=31536000, immutable" },
				],
			},
			{
				source: "/_next/static/:path*",
				headers: [
					{ key: "Cache-Control", value: "public, max-age=31536000, immutable" },
				],
			},
			{
				source: "/(.*)",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "SAMEORIGIN" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
				],
			},
		];
	},

	async rewrites() {
		return [
			{
				source: "/backend-images/:path*",
				destination: `${backendOrigin}/:path*`,
			},
		];
	},
};

export default nextConfig;
