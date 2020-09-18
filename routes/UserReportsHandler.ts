import { Request, Response, NextFunction } from 'express';
import UserReportService from '../services/UserReportService';
import SlackService from '../services/SlackService';

export default function userReportsHandler(userReportService: UserReportService, slackService: SlackService) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!slackService) {
      res.status(503).json({ error: 'service not enabled' });
      return;
    }

    try {
      const queryParameters = {
        apis: req.query.apis,
      };

      if (queryParameters.apis) {

        const apiList: string[] = queryParameters.apis.split(',');
        const report: string = await userReportService.generateCSVReport(apiList);
        await slackService.sendConsumerReport(report, apiList);
      } else {

        const report: string = await userReportService.generateCSVReport();
        await slackService.sendConsumerReport(report);
      }

      res.sendStatus(200);
    } catch (err) {
      err.action = 'creating and sending user/consumer csv report';
      next(err);
    }
  };
}