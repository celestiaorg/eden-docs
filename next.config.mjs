import nextra from 'nextra'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

const withNextra = nextra({
  mdxOptions: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
})

export default withNextra({
  output: 'export',
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      async_hooks: false,
      encoding: false,
      'pino-pretty': false,
      lokijs: false,
      '@tanstack/query-sync-storage-persister': false,
      '@react-native-async-storage/async-storage': false,
    }

    if (!isServer) {
      config.externals.push(
        'pino-pretty',
        'lokijs',
        'encoding',
        '@react-native-async-storage/async-storage'
      )
    }

    config.ignoreWarnings = [{ module: /node_modules\/@metamask\/sdk/ }]
    return config
  },
})
