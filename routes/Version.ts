import { RequestHandler } from 'express';
import VersionService from '../services/VersionService';

export default (versionService: VersionService): RequestHandler => (
  (_req, res): void => {
    res.json({ commitHash: versionService.commitHash });
  }
);
