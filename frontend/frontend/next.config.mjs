/** @type {import('next').NextConfig} */
const rawBackend =
	process.env.BACKEND_IMAGE_BASE_URL ||
	process.env.NEXT_PUBLIC_BACKEND_IMAGE_BASE_URL ||
	process.env.BACKEND_BASE_URL ||
	"http://139.59.34.214";

const backendOrigin = rawBackend.replace(/\/$/, "").replace(/\/api$/, "");

const nextConfig = {
	images: {
		qualities: [60, 75],
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
