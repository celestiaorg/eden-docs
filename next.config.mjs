import nextra from 'nextra'
 
// Set up Nextra with its configuration
const withNextra = nextra({
  // ... Add Nextra-specific options here
})
 
// Export the final Next.js config with Nextra included
export default withNextra({
  output: 'export',
  images: {
    unoptimized: true
  },
  // Uncomment and update if deploying to a subpath (e.g., username.github.io/repo-name)
  // basePath: '/repo-name',
  // assetPrefix: '/repo-name'
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'async_hooks': false,
      'encoding': false,
      'pino-pretty': false,
      'lokijs': false,
      '@tanstack/query-sync-storage-persister': false,
      '@react-native-async-storage/async-storage': false,
    }
    
    if (!isServer) {
      config.externals.push('pino-pretty', 'lokijs', 'encoding', '@react-native-async-storage/async-storage')
    }
    
    // Ignore optional dependencies
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
    ]
    
    return config
  },
})