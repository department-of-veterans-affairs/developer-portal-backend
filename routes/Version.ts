import { RequestHandler } from 'express';
import { getBakedEnv } from '../generated/baked-env';

export default (): RequestHandler => (
  (_req, res): void => {
    res.json({ commitHash: getBakedEnv('NODE_APP_COMMIT_HASH') ?? 'undefined' });
  }
);
