import '@/css/main.css'
import { Montserrat } from 'next/font/google'
import Script from 'next/script'

const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
})

import WebAwesomeProvider from '@/components/WebAwesomeProvider'

export default function RootLayout({ children }) {

  return (
    <html lang="pt">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0" />
        <link rel="manifest" href="/manifest.json" />
        <title>Daboxi</title>
        <Script defer src="https://analytics.emanuelsaramago.com/script.js" data-website-id="3bb64fca-1327-48ed-81bb-c809ea244b10"></Script>
      </head>
      <body className={`${montserrat.className}`}>
        <WebAwesomeProvider />
        {children}
      </body>
    </html>
  )
}
