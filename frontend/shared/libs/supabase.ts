import { createClient } from '@supabase/supabase-js';
import { NextApiRequest } from 'next';

// It's fine to expose these on the client,
// according to Supabase: https://supabase.com/docs/guides/with-nextjs#initialize-a-nextjs-app.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const supabase = createClient(URL, ANON_KEY);

export const authServerSideProps = async (req: NextApiRequest) => {
  const { user } = await supabase.auth.api.getUserByCookie(req);

  if (!user) {
    return { props: {}, redirect: { destination: '/login', permanent: false } };
  }
  console.debug(`retrieved auth user ${user.id} (${user.email}) from cookie`);

  return { props: { user } };
};
