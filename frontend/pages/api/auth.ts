import { logger } from 'logging';
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from 'shared/libs/supabase';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  logger.debug('change in authentication, setting cookies!');
  supabase.auth.api.setAuthCookie(req, res);
}
