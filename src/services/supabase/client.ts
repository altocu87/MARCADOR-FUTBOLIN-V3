import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

function isPublicKey(value: string): boolean {
  if (value.startsWith('sb_publishable_')) return true
  try {
    const payload = JSON.parse(atob(value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { role?: string }
    return payload.role === 'anon'
  } catch { return false }
}

export const supabase = url && key && isPublicKey(key)
  ? createClient<Database>(url, key, {
      global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(12_000) }) },
    })
  : null
