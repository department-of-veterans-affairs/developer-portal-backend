/* eslint-disable id-length */

import { Request, Response, NextFunction } from 'express';
import Joi from '@hapi/joi';
import logger from '../config/logger';
import GovDeliveryService from '../services/GovDeliveryService';
import { DevPortalError } from '../models/DevPortalError';
import { validateApiList, emailValidator, validatePhoneFormat } from '../util/validators';
import { ProductionAccessSupportEmail } from '../types/ProductionAccess';

export const productionSchema = Joi.object()
  .keys({
    apis: Joi.custom(validateApiList).required(),
    appDescription: Joi.string(),
    appName: Joi.string(),
    breachManagementProcess: Joi.string(),
    businessModel: Joi.string().required(),
    centralizedBackendLog: Joi.string(),
    distributingAPIKeysToCustomers: Joi.boolean(),
    exposeVeteranInformationToThirdParties: Joi.boolean(),
    listedOnMyHealthApplication: Joi.boolean(),
    monitizationExplanation: Joi.string(),
    monitizedVeteranInformation: Joi.boolean().required(),
    multipleReqSafeguards: Joi.string(),
    namingConvention: Joi.string(),
    organization: Joi.string().required(),
    phoneNumber: Joi.custom(validatePhoneFormat).required(),
    piiStorageMethod: Joi.string(),
    platforms: Joi.string(),
    policyDocuments: Joi.array().items(Joi.string()).required(),
    primaryContact: Joi.object({
      email: Joi.string().email().custom(emailValidator).required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
    }).required(),
    productionKeyCredentialStorage: Joi.string(),
    productionOrOAuthKeyCredentialStorage: Joi.string(),
    scopesAccessRequested: Joi.string(),
    secondaryContact: Joi.object({
      email: Joi.string().email().custom(emailValidator).required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
    }).required(),
    signUpLink: Joi.array().items(Joi.string()),
    statusUpdateEmails: Joi.array().items(Joi.string().email().custom(emailValidator)).required(),
    storePIIOrPHI: Joi.boolean().required(),
    supportLink: Joi.array().items(Joi.string()),
    thirdPartyInfoDescription: Joi.string(),
    valueProvided: Joi.string().required(),
    vasiSystemName: Joi.string(),
    veteranFacing: Joi.boolean().required(),
    veteranFacingDescription: Joi.string().max(415),
    vulnerabilityManagement: Joi.string(),
    website: Joi.string(),
  })
  .options({ abortEarly: false });

type ProductionAccessRequest = Request<
  Record<string, unknown>,
  Record<string, unknown>,
  ProductionAccessSupportEmail,
  Record<string, unknown>
>;

const productionRequestHandler =
  (govdelivery: GovDeliveryService | undefined) =>
  async (req: ProductionAccessRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (govdelivery) {
        logger.info({ message: 'sending production access email to support' });
        await govdelivery.sendProductionAccessEmail(req.body);
        logger.info({ message: 'sending production access email to consumer' });
        await govdelivery.sendProductionAccessConsumerEmail(req.body.statusUpdateEmails);
        res.sendStatus(200);
      }
    } catch (err: unknown) {
      (err as DevPortalError).action = 'sending govdelivery production access request notification';
      next(err);
    }
  };

export default productionRequestHandler;
