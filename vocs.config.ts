import { defineConfig } from 'vocs/config'

const defaultBaseUrl = 'https://docs.eden.zone'
const baseUrl = (process.env.VOCS_BASE_URL ?? defaultBaseUrl).replace(/\/+$/, '')

export default defineConfig({
  srcDir: 'docs',
  // Fully prerender every page so the deploy is plain static assets; the
  // /api/mcp endpoint is served by worker/index.js (the Cloudflare Pages
  // _worker.js), which reads the static markdown this build emits.
  renderStrategy: 'full-static',
  title: 'Eden docs',
  description: 'Documentation for Eden',
  logoUrl: '/celestia-eden-logo.svg',
  iconUrl: '/favicon.svg',
  // Used verbatim for the emitted <base> tag and absolute metadata URLs.
  baseUrl,
  editLink: {
    link: 'https://github.com/celestiaorg/eden-docs/edit/main/docs/pages/:path',
    text: 'Edit on GitHub'
  },
  socials: [
    { icon: 'github', link: 'https://github.com/celestiaorg/eden-docs' },
    { icon: 'telegram', link: 'https://t.me/celestiacommunity' }
  ],
  accentColor: '#35A35A',
  colorScheme: 'light dark',
  mcp: {
    enabled: true
  },
  sidebar: [
    { text: 'Welcome', link: '/' },
    {
      text: 'Why Eden',
      link: '/why-eden'
    },
    {
      text: 'Use the docs with AI',
      link: '/use-the-docs-with-ai'
    },
    {
      text: 'Networks',
      collapsed: false,
      items: [
        { text: 'Eden mainnet', link: '/networks/mainnet' },
        { text: 'Eden testnet', link: '/networks/testnet' }
      ]
    },
    {
      text: 'Development environments',
      collapsed: false,
      items: [
        { text: 'Foundry quickstart', link: '/development-environments/foundry-quickstart' },
        { text: 'Session keys with cast', link: '/development-environments/session-keys-cast' },
        { text: 'Supported EIPs', link: '/development-environments/supported-eips' }
      ]
    },
    {
      text: 'Tokens',
      collapsed: false,
      items: [{ text: 'Token reference', link: '/tokens/reference' }]
    },
    {
      text: 'Frontend libraries',
      collapsed: false,
      items: [
        { text: 'viem quickstart', link: '/frontend-libraries/viem-quickstart' },
        { text: 'viem transactions', link: '/frontend-libraries/viem-transactions' },
        { text: 'wagmi quickstart', link: '/frontend-libraries/wagmi-quickstart' }
      ]
    },
    {
      text: 'Tooling',
      collapsed: false,
      items: [
        { text: 'Bridging', link: '/tooling/bridging' },
        {
          text: 'Indexers',
          collapsed: false,
          items: [
            { text: 'Overview of indexers', link: '/tooling/indexers/overview' },
            { text: 'Quickstart with Goldsky', link: '/tooling/indexers/quickstart' },
            { text: 'Example with Goldsky', link: '/tooling/indexers/example' }
          ]
        },
        { text: 'Oracles', link: '/tooling/oracles' },
        { text: 'Wallets', link: '/tooling/wallets' }
      ]
    },
    {
      text: 'Guides',
      collapsed: false,
      items: [
        { text: 'Build a frontend', link: '/guides/build-a-frontend' },
        { text: 'Run a full node', link: '/guides/run-a-full-node' },
        { text: 'Onchain primer for web2 devs', link: '/guides/web2toweb3' }
      ]
    },
    {
      text: 'Legal',
      collapsed: true,
      items: [{ text: 'Disclaimer', link: '/legal/disclaimer' }]
    }
  ]
})
