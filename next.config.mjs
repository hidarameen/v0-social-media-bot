/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['pg'],
  images: {
    unoptimized: true,
  },
 
}

export default nextConfig
