import moment, { Moment } from 'moment';
import { Request, Response, NextFunction } from 'express';

import SlackService, { ApplyWrapup } from '../../services/SlackService';
import SignupMetricsService from '../../services/SignupMetricsService';

export default function applyWrapupHandler(signups: SignupMetricsService, slack: SlackService | undefined) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!slack) {
      res.status(503).json({ error: 'service not enabled' });
      return;
    }

    const span = req.query.span || 'week';
    const end = moment();
    let start: Moment;

    if (span === 'month') {
      start = moment().subtract(1, 'months');
    } else {
      start = moment().subtract(1, 'weeks');
    }

    const spanQuery = signups.countSignups({
      startDate: start,
      endDate: end,
    });

    const allTimeQuery = signups.countSignups({ endDate: end });

    const [spanResult, allTimeResult] = await Promise.all([spanQuery, allTimeQuery]);

    const spanWrapup: ApplyWrapup = {
      end,
      duration: span,
      signups: spanResult,
    };

    try {
      await slack.sendWrapupMessage(spanWrapup, allTimeResult);
      res.sendStatus(200);
    } catch(err) {
      err.action = `apply wrapup message`;
      next(err);
    }
  };
}

