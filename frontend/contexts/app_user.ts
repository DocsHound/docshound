import { User } from '@supabase/supabase-js';
import { createContext, useEffect, useState } from 'react';
import { captureError } from 'shared/libs/errors';
import { supabase } from 'shared/libs/supabase';
import { AppUser } from 'shared/libs/types';

export const AppUserContext = createContext<AppUser | null>(null);

export const useAppUser = (user: User | null) => {
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (!user) {
      setAppUser(null);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from<AppUser>('User')
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
