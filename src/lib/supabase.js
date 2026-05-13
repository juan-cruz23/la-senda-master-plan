import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://hmyfcyddgeocyiudkghn.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteWZjeWRkZ2VvY3lpdWRrZ2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDExODQsImV4cCI6MjA5NDI3NzE4NH0.YnLns-AqB4TOzE2JZY8-TiNZqw1QNkWwQ-8hJErMEEw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
