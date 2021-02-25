import { RequestHandler } from 'express';
import HealthCheck from '../models/HealthCheck';
import { MonitoredService } from '../types';
import KongService from '../services/KongService';
import OktaService from '../services/OktaService';
import DynamoService from '../services/DynamoService';
import GovDeliveryService from '../services/GovDeliveryService';
import SlackService from '../services/SlackService';
import { DevPortalError } from '../models/DevPortalError';

export default function healthCheckHandler(kong: KongService,
  okta: OktaService,
  dynamo: DynamoService,
  govdelivery: GovDeliveryService,
  slack: SlackService): RequestHandler {
  return async function (_req, res, next): Promise<void> {
    try {
      const services: MonitoredService[] = [kong, okta, dynamo, govdelivery, slack];
      const healthCheck = new HealthCheck(services);
      await healthCheck.check();
      res.json(healthCheck.getResults());
    } catch(err: unknown) {
      (err as DevPortalError).action = 'checking health of services';
      next(err);
    }
  };
}
