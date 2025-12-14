'use client'

import '@/css/main.css'
import { Analytics } from '@vercel/analytics/react'
import { Montserrat } from 'next/font/google'

const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
})

export default function RootLayout({ children }) {

  return (
    <html lang="pt">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0" />
        <link rel="manifest" href="/manifest.json" />
        <title>Daboxi</title>
      </head>
      <body className={`${montserrat.className}`}>
        {children}

        <Analytics />

      </body>
    </html>
  )
}
