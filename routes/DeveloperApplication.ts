import { Request, Response, NextFunction } from 'express';
import { DynamoDB } from 'aws-sdk';
import { FormSubmission } from '../types/FormSubmission';
import pick from 'lodash.pick';
import logger from '../config/logger';
import User from '../models/User';
import KongService from '../services/KongService';
import OktaService from '../services/OktaService';
import GovDeliveryService from '../services/GovDeliveryService';
import SlackService from '../services/SlackService';

export default function developerApplicationHandler(kong: KongService, 
  okta: OktaService | undefined, 
  dynamo: DynamoDB.DocumentClient, 
  govdelivery: GovDeliveryService | undefined, 
  slack: SlackService | undefined) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    const form: FormSubmission = pick(req.body, [
      'firstName',
      'lastName',
      'organization',
      'description',
      'email',
      'oAuthRedirectURI',
      'oAuthApplicationType',
      'termsOfService',
      'apis',
    ]);
    const user: User = new User(form);
    /* 
     * Sign up the user in Kong and Okta, record it in DynamoDB,
     * and return the result to UI as quickly as possible. Report
     * an error to the UI with the call to next if any of these critical steps fail.
     */
    try {
      if (user.shouldUpdateKong()) {
        logger.info({ message: 'creating Kong consumer' });
        await user.saveToKong(kong);
      }

      if (user.shouldUpdateOkta() && okta) {
        logger.info({ message: 'creating Okta client application' });
        await user.saveToOkta(okta);
      }

      logger.info({ message: 'recording signup in DynamoDB' });
      await user.saveToDynamo(dynamo);

      if (!user.oauthApplication) {
        res.json({ token: user.token });
      } else {
        res.json({
          clientID: user.oauthApplication.client_id,
          clientSecret: user.oauthApplication.client_secret,
          token: user.token,
        });
      }
    } catch (err) {
      next(err);
      return;
    }

    /*
     * Try actions that won't trigger a failure in the UI like sending
     * a welcome email and notifying Slack about the signup.
     */
    try {
      if (govdelivery) {
        logger.info({ message: 'sending email to new user' });
        await user.sendEmail(govdelivery);
      }
    } catch(err) {
      err.action = 'sending govdelivery signup notification';
      next(err);
    }

    try {
      if (slack) {
        logger.info({ message: 'sending success to slack' });
        await user.sendSlackSuccess(slack);
      }     
    } catch (err) {
      err.action = 'sending slack signup message';
      next(err);
    }
  };
}
