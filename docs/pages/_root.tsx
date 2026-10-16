import type { ReactNode } from 'react'
import VocsRoot, { getConfig } from 'vocs/waku/internal/routes/_root'

export default function Root({ children }: { children: ReactNode }) {
  return (
    <VocsRoot>
      <meta name="is-agentic-site-type" content="content" />
      <link rel="ai-catalog" type="application/json" href="/.well-known/ai-catalog.json" />
      <link rel="api-catalog" type="application/linkset+json" href="/.well-known/api-catalog" />
      <link rel="describedby" type="application/json" href="/.well-known/agent-skills/index.json" />
      <script type="module" src="/webmcp.js" />
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              '@id': 'https://docs.eden.zone/#website',
              name: 'Eden docs',
              url: 'https://docs.eden.zone',
              description: 'Developer documentation for Eden, an EVM network powered by Celestia.',
              inLanguage: 'en',
              publisher: { '@id': 'https://docs.eden.zone/#organization' }
            },
            {
              '@type': 'Organization',
              '@id': 'https://docs.eden.zone/#organization',
              name: 'Celestia Labs',
              legalName: 'Monoma Ltd.',
              url: 'https://docs.eden.zone/about',
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'security disclosures',
                email: 'security@celestia.org',
                url: 'https://docs.eden.zone/contact'
              }
            }
          ]
        })}
      </script>
      <script
        data-domain="docs.eden.zone"
        defer
        src="https://plausible.celestia.org/js/plausible.js"
      />
      {children}
    </VocsRoot>
  )
}

export { getConfig }
