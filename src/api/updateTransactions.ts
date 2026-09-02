'use server'

import { updateAppwriteRow } from '@/lib/appwrite'
import { requireAuth, getAuthenticatedUserId } from '@/lib/appwriteServer'
import { Permission, Role } from '@node_modules/appwrite'

interface Record {
  id: string
  fields: Object
}

export default async function updateTransactions(records: Array<Record>) {
  await requireAuth()
  const userId = await getAuthenticatedUserId()

  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId))
  ]

  await Promise.all(
    records.map(record => updateAppwriteRow('transactions', record.id, record.fields, permissions))
  )
}