/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@ai-founder/ui', '@ai-founder/db', '@ai-founder/types'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  images: {
    domains: ['img.clerk.com'],
  },
}

module.exports = nextConfig
