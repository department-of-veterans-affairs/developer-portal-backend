import { Request, Response, NextFunction, RequestHandler } from 'express';
import HealthCheck from '../models/HealthCheck';
import { MonitoredService } from '../types';
import KongService from '../services/KongService';
import OktaService from '../services/OktaService';
import DynamoService from '../services/DynamoService';
import GovDeliveryService from '../services/GovDeliveryService';
import SlackService from '../services/SlackService';

export default function healthCheckHandler(kong: KongService,
  okta: OktaService | undefined,
  dynamo: DynamoService,
  govdelivery: GovDeliveryService | undefined,
  slack: SlackService): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const services: MonitoredService[] = [kong, okta, dynamo, govdelivery, slack].filter(service => !!service) as MonitoredService[];
      const healthCheck = new HealthCheck(services);
      await healthCheck.check();
      res.json(healthCheck.getResults());
    } catch(err) {
      err.action = 'checking health of services';
      next(err);
    }
  };
}
