import { User as SupabaseUser } from '@supabase/supabase-js';
import { PrismaClient, User } from '@prisma/client';

export type GraphQLContext = {
  // If true, query is coming from another server (nextJS) and inherits admin permissions.
  serverAdmin: boolean;

  // Can be null if querying as server admin.
  supabaseUser: SupabaseUser | null;
  user: User | null;

  prisma: PrismaClient;
};
