import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Providers from './providers'
import { useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'scribbly',
  description: '1v1 drawio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className='dark'>
      <body className={inter.className + "bg-slate-700"}>
        <div className='flex items-center justify-center'>
          {/* Perhaps this link is also fuckign with the shifting */}
          <Link className='transition-colors hover:bg-slate-500 duration-500 py-2 z-10 w-full text-center bg-primary' href="/">
            scribbly
          </Link>
        </div>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
