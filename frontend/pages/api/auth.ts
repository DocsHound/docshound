import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from 'shared/libs/supabase';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.debug('change in authentication, setting cookies!');
  supabase.auth.api.setAuthCookie(req, res);
  res.send(200);
}
