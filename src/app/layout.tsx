import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { ClientOnly } from '@/components/ClientOnly'

import './globals.css'

import { Providers } from '@/providers/Providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Multi-Chain Wallet',
  description: 'A multi-chain wallet for the future',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-base-100`}
        data-theme='dark'
      >
        <ClientOnly>
          <Providers>{children}</Providers>
        </ClientOnly>
      </body>
    </html>
  )
}
