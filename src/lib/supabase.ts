import { createClient } from '@supabase/supabase-js';

// AgriTech Pro: Supabase Connection (Logbook App)
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const tables = {
    PROFILES: 'profiles', // For User Roles & Approvals
    LOGS: 'operation_logs',
    ATTENDANCE: 'attendance',
    PRODUCTION: 'production'
};
