const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@awesome.me/webawesome'],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  async generateBuildId() {
    return process.env.SOURCE_COMMIT || 'development'
  },
}

export default nextConfig