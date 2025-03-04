'use client'

import { ClientOnly } from '@/components/ClientOnly'

import { Providers } from '@/providers/Providers'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClientOnly>
        <Providers>{children}</Providers>
      </ClientOnly>
    </>
  )
}
