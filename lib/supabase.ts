import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://YOUR-PROJECT.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR-ANON-KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://YOUR-PROJECT.supabase.co' && 
         supabaseAnonKey !== 'YOUR-ANON-KEY';
}

// Types matching our Supabase schema
export type Event = {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  image_url?: string
  created_at: string
}

export type News = {
  id: string
  title: string
  content: string
  category: string
  important: boolean
  created_at: string
}

export type Poll = {
  id: string
  title: string
  description: string
  options: { id: string; text: string; votes: number }[]
  ends_at: string
  created_at: string
}

export type Contribution = {
  id: string
  event_id: string
  type: 'mitbringen' | 'helfen'
  description: string
  needed: number
  signed_up: number
}
