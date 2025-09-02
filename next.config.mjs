import nextra from 'nextra'
 
// Set up Nextra with its configuration
const withNextra = nextra({
  // Fix for copy page button in static exports
  // This ensures each page gets its own sourceCode instead of sharing
  staticImage: true,
  defaultShowCopyCode: true
})
 
// Export the final Next.js config with Nextra included
export default withNextra({
  output: 'export',
  images: {
    unoptimized: true
  },
  // Ensure clean builds for static export
  distDir: '.next',
  trailingSlash: true,
  // Uncomment and update if deploying to a subpath (e.g., username.github.io/repo-name)
  // basePath: '/repo-name',
  // assetPrefix: '/repo-name'
})