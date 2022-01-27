import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from 'shared/libs/supabase';
import useToast from './useToast';

// This listens for any auth changes on the client side (from supabase signin/signout/signup)
// and makes a request to our /api/auth endpoint to update our cookies.
const useAuth = () => {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<User | null>(supabase.auth.user());

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') setUser(null);
        else if (session) setUser(session.user);

        // Send session to /api/auth route to set the auth cookie.
        // NOTE: this is only needed if you're doing SSR (getServerSideProps)!
        fetch('/api/auth', {
          method: 'POST',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          credentials: 'same-origin',
          body: JSON.stringify({ event, session }),
        }).then((res) => {
          console.debug(res.json());
          console.debug('auth session', session);
          if (event === 'SIGNED_IN') {
            router.push('/');
            toast({
              title: 'Signed in successfully!',
            });
          } else if (event === 'SIGNED_OUT') {
            router.push('/login');
            toast({
              title: 'Signed out successfully!',
            });
          }
        });
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  return user;
};

export default useAuth;
