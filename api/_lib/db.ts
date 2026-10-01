import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

// Service role ключ живёт только здесь, на сервере. В браузер не попадает.
export function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не заданы')
    client = createClient(url, key, { auth: { persistSession: false } })
  }
  return client
}
