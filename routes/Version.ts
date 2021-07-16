import { RequestHandler } from 'express';

export default (): RequestHandler =>
  (_req, res): void => {
    // COMMIT_HASH is an environment variable that is built into the docker image
    // Anytime we deploy the docker image the same value is present for COMMIT_HASH
    const commitHash = process.env.COMMIT_HASH ?? 'undefined';

    res.json({ commitHash });
  };
