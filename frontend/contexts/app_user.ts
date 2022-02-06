import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from 'generated/graphql_types';
import { createContext, useEffect, useState } from 'react';
import { captureError } from 'shared/libs/errors';
import { supabase } from 'shared/libs/supabase';

export const AppUserContext = createContext<User | null>(null);

export const useAppUser = (user: SupabaseUser | null) => {
  const [appUser, setAppUser] = useState<User | null>(null);

  useEffect(() => {
    if (!user) {
      setAppUser(null);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from<User>('User')
        .select()
        .eq('id', user.id)
        .single();
      if (error) {
        captureError(error);
      } else {
        setAppUser(data);
      }
    })();
  }, [user]);

  return appUser;
};
