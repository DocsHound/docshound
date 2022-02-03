# DocsHound: Search and Work Everywhere

DocsHound is an open-source workplace search and work hub platform. It connects to all your favorite apps — Notion, Slack, and Google Drive to name a few — and provides a singular interface to search across your files and documents.

## Integrations

### Slack

Install the DocsHound app to your Workspace with `integrations/slack_manifest.yml` App Manifest. Then navigate to `/settings` on an Admin account (first registered user is always an Admin) and input the appropriate credentials from your newly created Slack app.

## Development

### Key endpoints

- `https://localhost:3001`: DocsHound NextJS frontend
- `https://localhost:5500`: DocsHound Express backend
- `http://localhost:3000`: Supabase dashboard
- `http://localhost:8000`: Kong (Supabase) backend

In Chrome, you'll need to enable unsafe https localhost by navigating to `chrome://flags/#allow-insecure-localhost`.

### Start up

#### Supabase

First we need to start Supabase:

```sh
cd supabase-docker/
cp .env.example .env
# Then modify .env, namely:
#   - Create POSTGRES_PASSWORD
#   - Generate + set JWT_SECRET (openssl rand 32 | base64)
#   - Set ANON_KEY and SERVICE_ROLE_KEY (node ../backend/cli/gen_supabase_keys.js <JWT SECRET>)
#   - Set CLIENT_ID/SECRET for auth API KEYS (see https://supabase.com/docs/guides/auth/auth-google)

cp volumes/api/kong.yml.example volumes/api/kong.yml
# Then update the keys under "Consumers / Users" with the ANON_KEY and SERVICE_ROLE_KEY

# Actually start supabase (install/start docker if you haven't)
docker-compose up
```

#### Express Backend

Now we start the Express API backend:

```sh
cd backend/
cp .env.example .env
# Then modify .env, namely:
#   - SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY with what you generated above
#   - Generate API_CRED_AES_KEY/SERVER_ADMIN_SECRET (openssl rand 32 | base64)
#   - Update DATABASE_URL with the p/w you set in the Supabase .env

# Run migrations
yarn prisma migrate dev

# Start server
yarn dev
```

#### NextJS App

Now we start the NextJS app:

```sh
cd frontend/
cp .env.development .env.development.local
# Then modify:
#   - DOCSHOUND_SERVER_ADMIN_SECRET (match what you generated for SERVER_ADMIN_SECRET)
#   - NEXT_PUBLIC_SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY (as above)

# Start server
yarn dev

# Separately, watch for graphql type changes
yarn generate
```
