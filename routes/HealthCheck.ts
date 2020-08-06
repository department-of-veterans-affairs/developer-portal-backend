import { Request, Response, NextFunction, RequestHandler } from 'express';
import HealthCheck from '../models/HealthCheck';
import { MonitoredService, ServiceHealthCheckResponse } from '../types';
import KongService from '../services/KongService';
import OktaService from '../services/OktaService';
import DynamoService from '../services/DynamoService';
import GovDeliveryService from '../services/GovDeliveryService';
import SlackService from '../services/SlackService';
import UninitializedService from '../services/UninitializedService';

export default function healthCheckHandler(kong: KongService, 
  okta: OktaService | undefined, 
  dynamo: DynamoService, 
  govdelivery: GovDeliveryService | undefined, 
  slack: SlackService | UninitializedService): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    const healthCheck: HealthCheck = new HealthCheck;

    try {
      const services: MonitoredService[] = [kong, okta, dynamo, govdelivery, slack].filter(service => !!service)  as MonitoredService[];
      const resultPromises: Promise<ServiceHealthCheckResponse>[] = services.map(service => service.healthCheck());
      const results = await Promise.all(resultPromises);
      results.forEach(result => healthCheck.addResult(result));
    } catch(err) {
      err.action = 'checking health of services';
      next(err);
    }

    res.json(healthCheck.getResults());
  };
}
