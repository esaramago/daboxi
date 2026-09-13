import { NextRequest } from 'next/server'

export default function getBaseUrl(_request?: NextRequest): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '')
}
