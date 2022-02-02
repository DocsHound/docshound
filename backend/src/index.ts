import 'dotenv/config';
import 'reflect-metadata';

import { verifyEnvVars } from 'utils/verify_envvars';
verifyEnvVars();

import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { RequestHandler } from 'express';
import { startServer } from 'services/apollo';
import { makeClient, makeSchema } from 'services/prisma';
import { makeHTTPServer, useTLS } from 'services/httpserver';
import { corsDevConfig } from 'utils/cors';
import { initIndices } from 'services/elasticsearch';
import { getOrCreateApp, indexChannel } from 'integrations/slack';
import { logger } from 'logging';

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

app.get('/slack', async (_req, res) => {
  const bob = await getOrCreateApp(prisma);
  if (!bob) {
    res.send('OK');
    return;
  }
  await indexChannel(bob, 'C02U5GJ2VB9', 'channel', '0');
  res.send('OK');
});

app.get('/slack2', async (_req, res) => {
  const bob = await getOrCreateApp(prisma);
  if (!bob) {
    res.send('OK');
    return;
  }

  res.send('OK');
});

const main = async () => {
  const httpServer = makeHTTPServer(app);
  const schema = await makeSchema();
  const server = await startServer(app, httpServer, schema, prisma);

  // Initialize Slack app.
  try {
    await getOrCreateApp(prisma);
  } catch (err) {
    logger.error(err);
  }

  // Initialize ES.
  try {
    await initIndices();
  } catch (err) {
    logger.error(err);
  }

  httpServer.listen({ port: process.env.PORT }, async () => {
    serverListening = true;
    logger.info('NODE_ENV: %s', process.env.NODE_ENV);
    logger.info(
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
