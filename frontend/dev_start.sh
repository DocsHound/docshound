#!/bin/bash

# Generate TLS certs for https.
if [[ ! -f dev_certs/privkey.pem ]] ; then
  mkdir dev_certs/
  openssl genrsa > dev_certs/privkey.pem
  openssl req -new -x509 -key dev_certs/privkey.pem > dev_certs/fullchain.pem
fi

node server.js