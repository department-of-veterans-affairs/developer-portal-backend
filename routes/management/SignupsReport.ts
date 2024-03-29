import moment, { Moment } from 'moment';
import { Request, Response, NextFunction } from 'express';
import Joi from '@hapi/joi';

import SlackService from '../../services/SlackService';
import SignupMetricsService from '../../services/SignupMetricsService';
import { DevPortalError } from '../../models/DevPortalError';

interface SignupsReportQuery {
  start?: string;
  end?: string;
  span?: string;
}

export const signupsReportSchema = Joi.object().keys({
  end: Joi.date().iso(),
  span: Joi.valid('week', 'month'),
  start: Joi.date().iso(),
});

const setStartAndEndDates = (
  reqStart: string | undefined,
  reqEnd: string | undefined,
  span: string,
): { start: Moment; end: Moment } => {
  let start: Moment;
  let end: Moment;

  if (reqEnd) {
    end = moment(reqEnd);
  } else {
    end = moment();
  }

  if (reqStart) {
    start = moment(reqStart);
  } else if (span === 'month') {
    start = end.clone().subtract(1, 'months');
  } else {
    start = end.clone().subtract(1, 'weeks');
  }

  return { end, start };
};

const signupsReportHandler =
  (signups: SignupMetricsService, slack: SlackService) =>
  async (
    req: Request<
      Record<string, unknown>,
      Record<string, unknown>,
      Record<string, unknown>,
      SignupsReportQuery
    >,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const span = req.query.span ?? 'week';
    const { start, end } = setStartAndEndDates(req.query.start, req.query.end, span);

    try {
      const spanQuery = signups.countSignups({
        endDate: end,
        startDate: start,
      });

      const allTimeQuery = signups.countSignups({});

      const [spanResult, allTimeResult] = await Promise.all([spanQuery, allTimeQuery]);
      const formattedEndDate = end.utc().format('MM/DD/YYYY');

      await slack.sendSignupsMessage(span, formattedEndDate, spanResult, allTimeResult);
      res.sendStatus(200);
    } catch (err: unknown) {
      (err as DevPortalError).action = 'apply wrapup message';
      next(err);
    }
  };

export default signupsReportHandler;
