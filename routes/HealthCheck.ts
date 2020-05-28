import { Request, Response, NextFunction } from 'express';
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
  slack: SlackService | undefined) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    let failed = false;

    try {
      const kongSuccess = await kong.healthCheck();
      if (!kongSuccess) {
        throw new Error('Kong found no users');
      }
    } catch(err) {
      failed = true;
      err.action = 'checking Kong';
      next(err);
    }

    if (!failed) {
      res.status(200).json({ health_check_status: 'vibrant' });
    }
  };
}
