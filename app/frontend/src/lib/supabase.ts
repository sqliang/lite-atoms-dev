import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyuvmvmevununpcbhyyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dXZtdm1ldnVudW5wY2JoeXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzOTA3NTUsImV4cCI6MjA5OTk2Njc1NX0.2jHIOPaOxNI3PX5NU3B4rnccCDVXcObIKaY2J46mUOg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);