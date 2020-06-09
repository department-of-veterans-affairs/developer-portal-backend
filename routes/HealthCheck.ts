import { Request, Response, NextFunction, RequestHandler } from 'express';
import { DynamoDB } from 'aws-sdk';
import logger from '../config/logger';
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
    let failed = false;

    try {
      const kongSuccess = await kong.healthCheck();
      if (!kongSuccess) {
        throw new Error('Kong is lifeless');
      }
    } catch(err) {
      failed = true;
      err.action = 'checking Kong';
      next(err);
    }

    if (!failed) {
      res.json({ health_check_status: 'vibrant' });
    }
  };
}
