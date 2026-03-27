import { createClient } from '@supabase/supabase-js';

// AgriTech Pro: Supabase Connection (Logbook App)
const supabaseUrl = 'https://qxrfucvswafxnypsrupe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4cmZ1Y3Zzd2FmeG55cHNydXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzQzNTEsImV4cCI6MjA5MDIxMDM1MX0.3SmX432P1tnYb0J8UuUvX7gxQ6jqsO4JBBqXFVH0esU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const tables = {
    PROFILES: 'profiles', // For User Roles & Approvals
    LOGS: 'operation_logs',
    ATTENDANCE: 'attendance',
    PRODUCTION: 'production'
};
