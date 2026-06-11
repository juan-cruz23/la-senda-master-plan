import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://ymaetswesemhalicjtkn.supabase.co'
const SUPABASE_ANON = 'sb_publishable_Xb7vEOWIm0CtJlX3bvpuNQ_KhGH_swz'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
