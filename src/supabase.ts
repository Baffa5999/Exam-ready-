import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zpyuykvyghjkyquemsie.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6InpweXV5a3Z5Z2hqa3lxdWVtc2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjA3NTMsImV4cCI6MjA5NTY5Njc1M30.NsgW1eaA60AL_Fu4qHAdwAAZqaudByED8CI8wV4RFn8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
