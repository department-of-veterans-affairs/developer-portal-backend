import { Request, Response, NextFunction } from 'express';

import SlackService, { ApplyWrapup } from '../../services/SlackService';

export default function applyWrapupHandler(slack: SlackService | undefined) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!slack) {
      res.status(503).json({ error: 'service not enabled' });
      return;
    }

    const wrapup: ApplyWrapup = {
      duration: 'week',
      numApplications: 12,
      numByApi: [
        { name: 'Facilities', num: 7 },
        { name: 'Benefits', num: 6 },
      ],
    };
    try {
      await slack.sendWrapupMessage(wrapup);
      res.sendStatus(200);
    } catch(err) {
      err.action = `${wrapup.duration} apply wrapup message`;
      next(err);
    }
  };
}

