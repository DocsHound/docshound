import { NextApiRequest, NextApiResponse } from 'next';
import { Provider } from 'generated/graphql_types';
import { callbackHandler } from 'shared/libs/integrations';

const provider = Provider.Slack;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return callbackHandler(req, res, provider);
}
