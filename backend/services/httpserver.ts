import express from 'express';
import http from 'http';
import https from 'https';
import * as fs from 'fs';
import path from 'path';

export const useTLS = !!process.env.SSL_PATH;

export const makeHTTPServer = (app: express.Express) => {
  if (useTLS) {
    console.log('using https/TLS');
    return https.createServer(
      {
        key: fs.readFileSync(
          path.join(process.env.SSL_PATH as string, 'privkey.pem')
        ),
        cert: fs.readFileSync(
          path.join(process.env.SSL_PATH as string, 'fullchain.pem')
        ),
      },
      app
    );
  } else {
    console.log('using http (no TLS)');
    return http.createServer(app);
  }
};
