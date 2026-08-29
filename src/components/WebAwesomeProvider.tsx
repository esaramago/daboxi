'use client'

import { useEffect } from 'react'
import { registerIconLibrary } from '@awesome.me/webawesome/dist/components/icon/library.js'

export default function WebAwesomeProvider() {
  useEffect(() => {
    try {
      registerIconLibrary('default', {
        resolver: (name: string) => `/assets/icons/${name}.svg`,
        mutator: (svg: SVGElement) => svg.setAttribute('fill', 'currentColor'),
      })
    } catch (e) {
      console.warn('Web Awesome icon registration:', e)
    }
  }, [])

  return null
}

