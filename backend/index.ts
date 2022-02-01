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
import { corsDevConfig } from './utils/cors';
import { client } from './services/elasticsearch';
import { getOrCreateApp } from './integrations/slack';

let serverListening = false;
const app = express();
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') app.use(cors(corsDevConfig));

const prisma = makeClient();
getOrCreateApp(prisma);

// Status checks.

const statusCallback: RequestHandler = (_req, res) => {
  res.send(200).json('OK');
};

app.get('/', statusCallback);
app.get('/status', statusCallback);
app.get('/healthz', (_req, res) => {
  return res.status(serverListening ? 200 : 400).send(serverListening);
});

app.get('/es', (_req, res) => {
  client
    .info()
    .then((response) => console.log(response))
    .catch((error) => console.error(error));
  res.send('OK');
});

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
