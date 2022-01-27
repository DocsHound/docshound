'use strict';

const jwt = require('jsonwebtoken');

if (process.argv.length != 3) {
  console.error('Usage: node ... <JWT Secret>');
  process.exit(1);
}

const key = process.argv[2];

const base = {
  iss: 'supabase',
  iat: 1642914000,
  exp: 3000680400,
};

console.log(`JWT_SECRET=${key}`);
console.log(`ANON_KEY=${jwt.sign({ ...base, role: 'anon' }, key)}`);
console.log(
  `SERVICE_ROLE_KEY=${jwt.sign({ ...base, role: 'service_role' }, key)}`
);
