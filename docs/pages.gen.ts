// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages } from 'waku/router'

// prettier-ignore
type Page =
  | { path: '/development-environments/foundry-quickstart'; render: 'static' }
  | { path: '/development-environments/session-keys-cast'; render: 'static' }
  | { path: '/development-environments/supported-eips'; render: 'static' }
  | { path: '/frontend-libraries/viem-quickstart'; render: 'static' }
  | { path: '/frontend-libraries/viem-transactions'; render: 'static' }
  | { path: '/frontend-libraries/wagmi-quickstart'; render: 'static' }
  | { path: '/guides/build-a-frontend'; render: 'static' }
  | { path: '/guides/run-a-full-node'; render: 'static' }
  | { path: '/guides/web2toweb3'; render: 'static' }
  | { path: '/'; render: 'static' }
  | { path: '/legal/disclaimer'; render: 'static' }
  | { path: '/networks/mainnet'; render: 'static' }
  | { path: '/networks/testnet'; render: 'static' }
  | { path: '/tokens/reference'; render: 'static' }
  | { path: '/tooling/bridging'; render: 'static' }
  | { path: '/tooling/indexers/example'; render: 'static' }
  | { path: '/tooling/indexers/overview'; render: 'static' }
  | { path: '/tooling/indexers/quickstart'; render: 'static' }
  | { path: '/tooling/oracles'; render: 'static' }
  | { path: '/tooling/wallets'; render: 'static' }
  | { path: '/use-the-docs-with-ai'; render: 'static' }
  | { path: '/why-eden'; render: 'static' }

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>
  }
  interface CreatePagesConfig {
    pages: Page
  }
}
