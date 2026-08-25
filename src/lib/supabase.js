import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://vzrckhfctrxwpmuinfvd.supabase.co'
const SUPABASE_ANON = 'sb_publishable_2nlNAA6O6n4OcsbATWunrA_Qzjxi26n'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
