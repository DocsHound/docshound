import { createClient } from '@supabase/supabase-js';

// For use with a client token.
export const anonSupabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string
);

// Bypasses RLS.
export const sRoleSupabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);
