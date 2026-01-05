import '@/css/main.css'
import { Montserrat } from 'next/font/google'
import Script from 'next/script'

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
        <Script
          src="https://plausible.emanuelsaramago.com/js/script.js"
          data-domain="daboxi"
          strategy="beforeInteractive"
        />
        <Script
          id="plausible-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }
            `,
          }}
        />
        <Script
          id="server-action-error-handler"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // #region agent log - Server Action error handler
              (function() {
                const originalFetch = window.fetch;
                let serverActionErrorCount = 0;
                const MAX_RETRIES = 1;
                
                window.fetch = function(...args) {
                  return originalFetch.apply(this, args).catch(async (error) => {
                    const url = args[0];
                    const isServerAction = typeof url === 'string' && (
                      url.includes('/_next/server-actions') || 
                      url.includes('/actions/') ||
                      url.includes('server-action')
                    );
                    
                    if (isServerAction && error.message && (
                      error.message.includes('Failed to find Server Action') ||
                      error.message.includes('server action')
                    )) {
                      serverActionErrorCount++;
                      
                      // #region agent log
                      try {
                        await originalFetch('http://127.0.0.1:7244/ingest/ce944489-1881-48c4-a9b6-0cd49044fa2b', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            location: 'layout.tsx:server-action-error-handler',
                            message: 'Server Action error detected',
                            data: {
                              errorMessage: error.message,
                              url: typeof url === 'string' ? url.substring(0, 200) : 'unknown',
                              errorCount: serverActionErrorCount,
                              userAgent: navigator.userAgent.substring(0, 100)
                            },
                            timestamp: Date.now(),
                            sessionId: 'debug-session',
                            runId: 'run1',
                            hypothesisId: 'D'
                          })
                        }).catch(() => {});
                      } catch {}
                      // #endregion agent log
                      
                      if (serverActionErrorCount <= MAX_RETRIES) {
                        // Try to reload the page to get fresh build
                        console.warn('Server Action error detected, reloading page...');
                        window.location.reload();
                        return Promise.reject(error);
                      }
                    }
                    
                    return Promise.reject(error);
                  });
                };
              })();
              // #endregion agent log
            `,
          }}
        />
        {children}
      </body>
    </html>
  )
}
