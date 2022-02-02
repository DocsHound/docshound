#!/bin/bash

# Generate TLS certs for https.
if [[ ! -f dev_certs/privkey.pem ]] || [[ ! -f dev_certs/fullchain.pem ]] ; then
  mkdir dev_certs/
  openssl genrsa > dev_certs/privkey.pem
  openssl req -new -x509 -key dev_certs/privkey.pem > dev_certs/fullchain.pem
fi

# NB: tsconfig-paths/register required to get absolute paths to work with ts-node-dev: https://github.com/wclr/ts-node-dev/issues/95#issuecomment-743435649
yarn ts-node-dev --respawn -r tsconfig-paths/register src/index.ts