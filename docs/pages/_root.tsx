import type { ReactNode } from 'react'
import VocsRoot, { getConfig } from 'vocs/waku/internal/routes/_root'

export default function Root({ children }: { children: ReactNode }) {
  return (
    <VocsRoot>
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
