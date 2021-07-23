/* eslint-disable max-params */

import { Request, Response, NextFunction } from 'express';
import Joi from '@hapi/joi';
import { FormSubmission } from '../types/FormSubmission';
import logger from '../config/logger';
import User from '../models/User';
import KongService from '../services/KongService';
import OktaService from '../services/OktaService';
import GovDeliveryService from '../services/GovDeliveryService';
import SlackService from '../services/SlackService';
import DynamoService from '../services/DynamoService';
import { validateApiList } from '../util/validators';
import { DevPortalError } from '../models/DevPortalError';

export const applySchema = Joi.object()
  .keys({
    apis: Joi.custom(validateApiList).required(),
    description: Joi.string().allow(''),
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    oAuthApplicationType: Joi.allow('').valid('web', 'native'),
    oAuthRedirectURI: Joi.string()
      .allow('')
      .uri({ scheme: ['http', 'https'] }),
    organization: Joi.string().required(),
    termsOfService: Joi.required().valid(true),
  })
  .options({ abortEarly: false });

interface DeveloperApplicationRequestBody {
  firstName: string;
  lastName: string;
  organization: string;
  description: string;
  email: string;
  oAuthRedirectURI: string;
  oAuthApplicationType: string;
  termsOfService: boolean;
  apis: string;
}

type DeveloperApplicationRequest = Request<
  Record<string, unknown>,
  Record<string, unknown>,
  DeveloperApplicationRequestBody,
  Record<string, unknown>
>;

const developerApplicationHandler =
  (
    kong: KongService,
    okta: OktaService | undefined,
    dynamo: DynamoService,
    govdelivery: GovDeliveryService | undefined,
    slack: SlackService | undefined,
  ) =>
  async (req: DeveloperApplicationRequest, res: Response, next: NextFunction): Promise<void> => {
    const {
      firstName,
      lastName,
      organization,
      description,
      email,
      oAuthRedirectURI,
      oAuthApplicationType,
      termsOfService,
      apis,
    } = req.body;

    const form: FormSubmission = {
      apis,
      description,
      email,
      firstName,
      lastName,
      oAuthApplicationType,
      oAuthRedirectURI,
      organization,
      termsOfService,
    };

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

      // eslint-disable-next-line no-negated-condition
      if (!user.oauthApplication) {
        res.json({
          kongUsername: user.kongConsumerId ? user.consumerName() : undefined,
          token: user.token,
        });
      } else {
        res.json({
          clientID: user.oauthApplication.client_id,
          clientSecret: user.oauthApplication.client_secret,
          kongUsername: user.kongConsumerId ? user.consumerName() : undefined,
          redirectURI: user.oAuthRedirectURI,
          token: user.token,
        });
      }
    } catch (err: unknown) {
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
    } catch (err: unknown) {
      (err as DevPortalError).action = 'sending govdelivery signup notification';
      next(err);
    }

    try {
      if (slack) {
        logger.info({ message: 'sending success to slack' });
        await user.sendSlackSuccess(slack);
      }
    } catch (err: unknown) {
      (err as DevPortalError).action = 'sending slack signup message';
      next(err);
    }
  };

export default developerApplicationHandler;
