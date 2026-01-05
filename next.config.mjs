const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // #region agent log - Server Actions cache configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      // Allow stale Server Actions to prevent "Failed to find Server Action" errors
      allowedRevalidateHeaderKeys: ['x-nextjs-build-id'],
    },
  },
  // Prevent caching of Server Actions
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // #endregion agent log
}

export default nextConfig