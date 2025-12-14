'use client'

export async function isDate(date: Date | string) {
  const dateFormat = new Date(date)
  return Object.prototype.toString.call(dateFormat) === '[object Date]'
}