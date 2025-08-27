import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import './globals.css'
import Link from 'next/link'


export const metadata = {
  title: 'Eden Docs',
  description: 'Documentation for Eden',
}

const banner = (
  <Link href="https://mammothon.celestia.org" style={{ textDecoration: 'none', color: 'inherit' }}>
    <Banner storageKey="eden-banner">Return To Eden Hackathon Starts Today! 🎉</Banner>
  </Link>
)
const navbar = (
  <Navbar
    logo={<b>Eden</b>}
  />
)
const footer = <Footer>MIT {new Date().getFullYear()} © Eden.</Footer>

export default async function RootLayout({ children }) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
    >
      <Head>
        {/* Your additional tags should be passed as `children` of `<Head>` element */}
      </Head>
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/celestiaorg/eden-docs"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
