import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Missing Supabase credentials. Please check your .env file.\n' +
        'Required variables:\n' +
        '  - VITE_SUPABASE_URL\n' +
        '  - VITE_SUPABASE_API_KEY'
    );
}

const supabase = createClient(supabaseUrl, supabaseKey);
export { supabase }