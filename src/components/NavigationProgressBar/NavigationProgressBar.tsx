'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function NavigationProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const barRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null)
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isNavigatingRef = useRef(false)

  const clearAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current)
  }

  const setProgress = (value: number) => {
    progressRef.current = value
    if (barRef.current) {
      barRef.current.style.width = `${value}%`
    }
  }

  const start = () => {
    clearAllTimers()
    isNavigatingRef.current = true

    if (barRef.current) {
      barRef.current.style.transition = 'width 200ms ease, opacity 200ms ease'
      barRef.current.style.opacity = '1'
    }
    setProgress(25)

    // Trickle progress up to 90%
    timerRef.current = setInterval(() => {
      if (progressRef.current >= 90) return
      const remaining = 90 - progressRef.current
      const step = Math.max(0.5, remaining * 0.1)
      setProgress(Math.min(90, progressRef.current + step))
    }, 200)

    // Safety timeout in case navigation is aborted or does not complete
    safetyTimerRef.current = setTimeout(() => {
      done()
    }, 15000)
  }

  const done = () => {
    if (!isNavigatingRef.current && progressRef.current === 0) return
    isNavigatingRef.current = false

    if (timerRef.current) clearInterval(timerRef.current)
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current)

    if (barRef.current) {
      barRef.current.style.transition = 'width 200ms ease, opacity 200ms ease'
      barRef.current.style.opacity = '1'
    }
    setProgress(100)

    fadeTimerRef.current = setTimeout(() => {
      if (barRef.current) {
        barRef.current.style.opacity = '0'
      }

      resetTimerRef.current = setTimeout(() => {
        if (barRef.current) {
          barRef.current.style.transition = 'none'
        }
        setProgress(0)
      }, 250)
    }, 200)
  }

  // Finish navigation progress whenever route changes
  useEffect(() => {
    done()
  }, [pathname, searchParams])

  // Setup click, popstate, and pushState/replaceState listeners
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      if (anchor.getAttribute('target') && anchor.getAttribute('target') !== '_self') return
      if (anchor.hasAttribute('download')) return

      try {
        const currentUrl = new URL(window.location.href)
        const targetUrl = new URL(anchor.href, window.location.href)

        if (targetUrl.origin !== currentUrl.origin) return
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search
        ) {
          return
        }

        start()
      } catch {
        // Ignore URL parsing errors
      }
    }

    const handlePopState = () => {
      start()
    }

    // Intercept pushState and replaceState
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState

    window.history.pushState = function (...args) {
      const url = args[2]
      if (url) {
        try {
          const currentUrl = new URL(window.location.href)
          const targetUrl = new URL(url.toString(), window.location.href)
          if (
            targetUrl.origin === currentUrl.origin &&
            (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search)
          ) {
            start()
          }
        } catch {
          // Ignore
        }
      }
      return originalPushState.apply(this, args)
    }

    window.history.replaceState = function (...args) {
      const url = args[2]
      if (url) {
        try {
          const currentUrl = new URL(window.location.href)
          const targetUrl = new URL(url.toString(), window.location.href)
          if (
            targetUrl.origin === currentUrl.origin &&
            (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search)
          ) {
            start()
          }
        } catch {
          // Ignore
        }
      }
      return originalReplaceState.apply(this, args)
    }

    document.addEventListener('click', handleAnchorClick, true)
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.removeEventListener('click', handleAnchorClick, true)
      window.removeEventListener('popstate', handlePopState)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      clearAllTimers()
    }
  }, [])

  return (
    <div
      ref={barRef}
      className="c-navigation-progress-bar"
      style={{
        width: '0%',
        opacity: 0,
      }}
    >
      <div className="c-navigation-progress-bar__peg" />
    </div>
  )
}
