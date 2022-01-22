export const assertEnvVar = (envvar: string) => {
  if (!process.env[envvar]) {
    throw `EnvVar '${envvar}' is blank/empty: ${process.env[envvar]}`;
  }
};
