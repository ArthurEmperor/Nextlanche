import { createClient } from '@supabase/supabase-js'

// Substitua pelos dados do seu projeto Supabase
const SUPABASE_URL = 'https://xiloeolriymcqwzaikus.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbG9lb2xyaXltY3F3emFpa3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MzAyNDQsImV4cCI6MjA3NjAwNjI0NH0.ZvLm35Kxb87D1lPHc_IZ6q-gpfYB_scUnj4WiZ5rUio'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)