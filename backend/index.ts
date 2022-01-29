import 'dotenv/config';
import 'reflect-metadata';

import { verifyEnvVars } from './utils/verify_envvars';
verifyEnvVars();

import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { RequestHandler } from 'express';
import { startServer } from './services/apollo';
import { makeClient, makeSchema } from './services/prisma';
import { makeHTTPServer, useTLS } from './services/httpserver';
import { anonSupabase, sRoleSupabase } from './services/supabase';
import { randomUUID } from 'crypto';
import { corsDevConfig } from './utils/cors';

let serverListening = false;
const app = express();
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') app.use(cors(corsDevConfig));

const prisma = makeClient();

// Status checks.

const statusCallback: RequestHandler = (_req, res) => {
  res.send(200).json('OK');
};

app.get('/', statusCallback);
app.get('/status', statusCallback);
app.get('/healthz', (_req, res) => {
  return res.status(serverListening ? 200 : 400).send(serverListening);
});

app.get('/garbage_lol', async (req, res) => {
  const token = req.get('X-Supabase-Auth') ?? '';
  console.log(token);
  anonSupabase.auth.setAuth(token);
  const result = await anonSupabase.from('UserRole').select();
  console.log(result);
  res.status(200).json(result);
});

app.post('/garbage1', async (_req, res) => {
  const { data, error } = await anonSupabase
    .from('GlobalApiCredential')
    .insert([
      {
        provider: 'garbage1',
        algorithm: 'garbage2',
        encryptedCredentials: 'garbage3',
      },
    ]);
  console.log(data, error);
  res.status(200);
});

app.post('/garbage', async (req, res) => {
  // const token = req.get('X-Supabase-Auth') ?? '';
  // const token = '';
  // console.log(token);
  // sRoleSupabase.auth.setAuth(token);

  const { data, error } = await sRoleSupabase
    .from('GlobalApiCredential')
    .insert([
      {
        id: randomUUID(),
        provider: 'garbage1',
        algorithm: 'garbage2',
        encryptedCredentials: 'garbage3',
      },
    ]);
  console.log(data, error);
  res.status(200);
});

// Other endspoints.

const main = async () => {
  const httpServer = makeHTTPServer(app);
  const schema = await makeSchema();
  const server = await startServer(app, httpServer, schema, prisma);

  httpServer.listen({ port: process.env.PORT }, () => {
    serverListening = true;
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log(
      `🚀 Server ready at: ${useTLS ? 'https' : 'http'}://localhost:${
        process.env.PORT
      }${server.graphqlPath}`
    );
  });
};

// Start your app
main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
