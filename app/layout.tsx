import { Footer, Layout, Navbar } from 'nextra-theme-docs' // eslint-disable-line no-unused-vars
import { Banner, Head } from 'nextra/components' // eslint-disable-line no-unused-vars
import { getPageMap } from 'nextra/page-map'
import './globals.css'
import Link from 'next/link' // eslint-disable-line no-unused-vars
import Image from 'next/image' // eslint-disable-line no-unused-vars
import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://crispy-eureka-2nvnerv.pages.github.io/'),
  title: 'Eden docs',
  description: 'Documentation for Eden',
  openGraph: {
    title: 'Eden docs',
    description: 'Documentation for Eden',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Eden Documentation'
      }
    ],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eden docs',
    description: 'Documentation for Eden',
    images: ['/og-image.png']
  }
}

const banner = (
  <Link href="https://return.celestia.org" style={{ textDecoration: 'none', color: 'inherit' }}>
    <Banner storageKey="eden-banner">Return to Eden hackathon starts today! 🎉</Banner>
  </Link>
)
const navbar = (
  <Navbar
    logoLink="/"
    logo={
      <Image
        src="/celestia-eden-logo.svg"
        alt="Celestia Eden"
        width={140}
        height={32}
        priority
        style={{ height: 'auto' }}
      />
    }
    projectLink="https://github.com/celestiaorg/eden-docs"
    // TODO: add public link for telegram chat
    // chatLink="https://t.me/edenbuilders"
    // chatIcon={
    //   <svg width="24" height="24" viewBox="0 0 16 16" aria-hidden="true">
    //     <path
    //       fill="currentColor"
    //       d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.01.868-.32 3.269-2.206 3.374-2.23c.05-.012.12-.026.166.016s.042.12.037.141c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8 8 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629q.14.092.27.187c.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09"
    //     />
    //   </svg>
    // }
  />
)
const footer = (
  <Footer>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <Link
        href="https://eden.celestia.org"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <Image src="/eden-logo.svg" alt="Eden" width={60} height={20} style={{ height: 'auto' }} />
      </Link>
      <span style={{ color: '#35A35A', fontWeight: '500' }}>•</span>
      <span>Infinity starts here</span>
    </div>
  </Footer>
)

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head>
        {/* SVG preferred */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* PNG fallback */}
        <link rel="icon" href="/favicon.png" sizes="32x32" type="image/png" />
        {/* Optional for iOS */}
        <link rel="apple-touch-icon" href="/favicon.png" />
      </Head>
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/celestiaorg/eden-docs/edit/main"
          footer={footer}
          sidebar={{
            autoCollapse: true, // collapse inactive folders
            defaultMenuCollapseLevel: 1
          }}
          copyPageButton={false}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
