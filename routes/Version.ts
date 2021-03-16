import { RequestHandler } from 'express';
import { bakedEnv } from '../generated/baked-env';

export default (): RequestHandler => (
  (_req, res): void => {
    res.send({ commitHash: bakedEnv.NODE_APP_COMMIT_HASH ?? 'undefined' });
  }
);
