import { Request, Response, NextFunction, RequestHandler } from 'express';
import { DynamoDB } from 'aws-sdk';
import HealthCheck, { ServiceHealthCheckResponse } from '../models/HealthCheck';
import { IService } from '../types';
import KongService from '../services/KongService';
import OktaService from '../services/OktaService';
import GovDeliveryService from '../services/GovDeliveryService';
import SlackService from '../services/SlackService';

export default function healthCheckHandler(kong: KongService, 
  okta: OktaService | undefined, 
  dynamo: DynamoDB.DocumentClient, 
  govdelivery: GovDeliveryService | undefined, 
  slack: SlackService | undefined): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    const healthCheck: HealthCheck = new HealthCheck;

    try {
      const kongHealth: ServiceHealthCheckResponse = await kong.healthCheck();
      healthCheck.addResult(kongHealth);

      const services: IService[] = [kong, okta, dynamo, govdelivery, slack].filter(service => !!service)  as IService[];
      const resultPromises: Promise<ServiceHealthCheckResponse>[] = services.map(service => service.healthCheck());
      const results = await Promise.all(resultPromises);
      results.forEach(result => healthCheck.addResult(result));
    } catch(err) {
      console.log(err);
      err.action = 'checking health of services';
      next(err);
    }

    res.json(healthCheck.getResults());
  };
}
