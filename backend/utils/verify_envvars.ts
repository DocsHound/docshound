const REQUIRED_ENVVARS: string[] = ['PORT'];

const OPTIONAL_ENVVARS: string[] = [
  // SLACK
  'SLACK_BOT_TOKEN',
  'SLACK_SIGNING_SECRET',
];

export const verifyEnvVars = () => {
  const badEnvVars = [];
  for (const envvar of REQUIRED_ENVVARS) {
    if (!process.env[envvar]) badEnvVars.push(envvar);
  }
  if (badEnvVars.length) {
    throw Error(`Missing required EnvVars: ${badEnvVars}`);
  }

  const badOptEnvVars = [];

  for (const envvar of OPTIONAL_ENVVARS) {
    if (!process.env[envvar]) badOptEnvVars.push(envvar);
  }
  if (badOptEnvVars.length)
    console.warn(`Missing optional EnvVars: ${badOptEnvVars}`);
};

export const throwEnvVarError = (envvarName: string) => {
  throw new Error(`invalid ENVVAR ${envvarName}: ${process.env[envvarName]}`);
};
