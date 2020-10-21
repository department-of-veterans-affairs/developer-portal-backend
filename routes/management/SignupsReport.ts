import moment, { Moment } from 'moment';
import { Request, Response, NextFunction } from 'express';
import Joi from '@hapi/joi';

import SlackService from '../../services/SlackService';
import SignupMetricsService from '../../services/SignupMetricsService';

export const signupsReportSchema = Joi.object().keys({
  span: Joi.valid('week', 'month'),
  start: Joi.date().iso(),
  end: Joi.date().iso(),
});

function setStartAndEndDates(reqStart: string | undefined, reqEnd: string | undefined, span: string): { start: Moment; end: Moment } {
  let start: Moment;
  let end: Moment;

  if (reqEnd) {
    end = moment(reqEnd);
  } else {
    end = moment();
  }

  if (reqStart) {
    start = moment(reqStart);
  } else {
    if (span === 'month') {
      start = end.clone().subtract(1, 'months');
    } else {
      start = end.clone().subtract(1, 'weeks');
    }
  }

  return { start, end };
}

export default function signupsReportHandler(signups: SignupMetricsService, slack: SlackService) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!slack) {
      res.status(503).json({ error: 'service not enabled' });
      return;
    }

    const span = req.query.span || 'week';
    const { start, end } = setStartAndEndDates(req.query.start, req.query.end, span);

    const spanQuery = signups.countSignups({
      startDate: start,
      endDate: end,
    });

    const allTimeQuery = signups.countSignups({});

    try {
      const [spanResult, allTimeResult] = await Promise.all([spanQuery, allTimeQuery]);
      const formattedEndDate = end.utc().format('MM/DD/YYYY');

      await slack.sendSignupsMessage(span, formattedEndDate, spanResult, allTimeResult);
      res.sendStatus(200);
    } catch(err) {
      err.action = `apply wrapup message`;
      next(err);
    }
  };
}

