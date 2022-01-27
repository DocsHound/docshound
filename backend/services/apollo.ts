import { AppRole, PrismaClient } from '@prisma/client';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { GraphQLSchema } from 'graphql';
import express from 'express';
import http from 'http';
import https from 'https';
import { GraphQLContext } from '../types';
import { anonSupabase } from '../services/supabase';
import { captureError } from '../services/errors';
import { corsDevConfig } from '../utils/cors';

const DEV_USER_ID = '568a9bb6-da37-4225-a48a-bb6686ad3a38';

export const startServer = async (
  app: express.Express,
  httpServer: http.Server | https.Server,
  schema: GraphQLSchema,
  prisma: PrismaClient
) => {
  const server = new ApolloServer({
    schema,

    context: async ({ req }): Promise<GraphQLContext> => {
      try {
        // For development (GraphQL explorer).
        if (
          process.env.NODE_ENV === 'development' &&
          req.get('X-Docshound-Dummy-User')
        ) {
          return {
            supabaseUser: {
              id: DEV_USER_ID,
              app_metadata: {},
              user_metadata: {},
              aud: '',
              created_at: '2021-01-23 22:38:00',
            },
            user: {
              id: DEV_USER_ID,
              role: AppRole.ADMIN,
              createdAt: new Date(Date.parse('2021-01-26 12:00:00')),
              updatedAt: new Date(Date.parse('2021-01-26 12:23:00')),
            },
            prisma,
            serverAdmin: true,
          };
        }

        if (!process.env.SERVER_ADMIN_SECRET) {
          throw new Error(
            'Expected SERVER_ADMIN_SECRET envvar to be non-empty'
          );
        }

        const serverAdmin =
          req.get('X-Docshound-Server-Admin-Secret') ===
          process.env.SERVER_ADMIN_SECRET;

        const { user: supabaseUser } =
          await anonSupabase.auth.api.getUserByCookie(req);

        if (!serverAdmin && !supabaseUser) {
          throw new Error('requires authentication via cookies');
        }

        const user = supabaseUser
          ? await prisma.user.findUnique({
              where: {
                id: supabaseUser.id,
              },
            })
          : null;

        if (!serverAdmin && !user) {
          throw new Error(
            `expected to find public.User for supabase user: ${supabaseUser?.id}`
          );
        }

        return {
          supabaseUser,
          user,
          prisma,
          serverAdmin,
        };
      } catch (err) {
        captureError(err);
        // We have to re-throw otherwise Apollo will think there is no error.
        throw err;
      }
    },
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();
  server.applyMiddleware({
    app,
    path: '/graphql',
    cors: process.env.NODE_ENV === 'development' ? corsDevConfig : undefined,
  });

  return server;
};
