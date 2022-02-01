# DocsHound Backend API/Service

## Development

```sh
# Copy .example.env to .env and fill in missing ENV vars.
cp .example.env .env
```

## Integrations

### Slack

## ElasticSearch

Start a single-node cluster:

```sh
docker run -p 127.0.0.1:9200:9200 -p 127.0.0.1:9300:9300 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.16.3
```

## Supabase

Steps followed:

1. Copied `.env.example` to `.env` under `docker/`
2. Generate `JWT_SECRET` (e.g., `openssl rand 32 | base64`) and [re-generate ANON + SERVICE_ROLE keys](https://supabase.com/docs/guides/hosting/overview#api-keys)
   - Update ANON & SERVICE_ROLE keys in BOTH `.env` and `volumes/api/kong.yml`!
3. Run `docker-compose up`, should download images + start container
4. Verify `http://localhost:3000` shows Supabase dashboard

### Authentication/OAuth

Supabase runs `https://github.com/netlify/gotrue` underneath as a docker image. In the `docker/docker-compose.yml` file, we need to add the following envvar mapping for a given provider `X` (e.g., `X = GOOGLE`):

```
GOTRUE_EXTERNAL_GOOGLE_ENABLED: 'true'
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: ${EXTERNAL_GOOGLE_CLIENT_ID}
GOTRUE_EXTERNAL_GOOGLE_SECRET: ${EXTERNAL_GOOGLE_SECRET}
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: ${EXTERNAL_GOOGLE_REDIRECT_URI}
```

We then pass through the following in `.env` (see each Auth guide such as [the one for Google](`https://supabase.com/docs/guides/auth/auth-google`) for creating the `CLIENT_ID` and `SECRET`):

```
EXTERNAL_GOOGLE_CLIENT_ID=
EXTERNAL_GOOGLE_SECRET=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
EXTERNAL_GOOGLE_REDIRECT_URI=http://localhost:8000/auth/v1/callback
```

Restart the docker images with `docker-compose up`. Navigating to `http://localhost:8000/auth/v1/authorize?provider=google` should now redirect to the provider's OAuth consent screen.
