import { RequestHandler } from 'express';
import HealthCheck from '../models/HealthCheck';
import { MonitoredService } from '../types';
import KongService from '../services/KongService';
import OktaService from '../services/OktaService';
import DynamoService from '../services/DynamoService';
import GovDeliveryService from '../services/GovDeliveryService';
import SlackService from '../services/SlackService';
import { DevPortalError } from '../models/DevPortalError';

interface HealthCheckServiceOptions {
  kong: KongService;
  okta: OktaService;
  dynamo: DynamoService;
  slack: SlackService;
}

const healthCheckHandler =
  ({ kong, okta, dynamo, slack }: HealthCheckServiceOptions): RequestHandler =>
  async (_req, res, next): Promise<void> => {
    try {
      const services: MonitoredService[] = [kong, okta, dynamo, slack];
      const healthCheck = new HealthCheck(services);
      await healthCheck.check();
      res.json(healthCheck.getResults());
    } catch (err: unknown) {
      (err as DevPortalError).action = 'checking health of services';
      next(err);
    }
  };

  const govDeliveryHealthCheckHandler =
  (govDelivery: GovDeliveryService): RequestHandler =>
  async (_req, res, next): Promise<void> => {
    try {
      const healthCheck = new HealthCheck([govDelivery]);
      await healthCheck.check();
      res.json(healthCheck.getResults());
    } catch (err: unknown) {
      (err as DevPortalError).action = 'checking health of services';
      next(err);
    }
  };

export default healthCheckHandler;
export { govDeliveryHealthCheckHandler };
