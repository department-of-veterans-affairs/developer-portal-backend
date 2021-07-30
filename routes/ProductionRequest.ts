import { Request, Response, NextFunction } from 'express';
import Joi from '@hapi/joi';
import logger from '../config/logger';
import GovDeliveryService from '../services/GovDeliveryService';
import { DevPortalError } from '../models/DevPortalError';
import { validateApiList, emailValidator, validatePhoneFormat } from '../util/validators';
import {  ProductionAccessSupportEmail } from '../types/ProductionAccess';

export const productionSchema = Joi.object().keys({
  primaryContact: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().custom(emailValidator).required(),
  }).required(),
  secondaryContact: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().custom(emailValidator).required(),
  }).required(),
  organization: Joi.string().required(),
  appName: Joi.string().required(),
  appDescription: Joi.string().required(),
  statusUpdateEmails: Joi.array().items(Joi.string().email().custom(emailValidator)).required(),
  valueProvided: Joi.string().required(),
  businessModel: Joi.string(),
  policyDocuments: Joi.array().items(Joi.string()).required(),
  phoneNumber: Joi.custom(validatePhoneFormat).required(),
  apis: Joi.custom(validateApiList).required(),
  monitizedVeteranInformation: Joi.boolean().required(),
  monitizationExplanation: Joi.string(),
  veteranFacing: Joi.boolean().required(),
  website: Joi.string(),
  signUpLink: Joi.array().items(Joi.string()),
  supportLink: Joi.array().items(Joi.string()),
  platforms: Joi.string(),
  veteranFacingDescription: Joi.string().max(415),
  vasiSystemName: Joi.string(),
  credentialStorage: Joi.string().required(),
  storePIIOrPHI: Joi.boolean().required(),
  piiStorageMethod: Joi.string(),
  multipleReqSafeguards: Joi.string(),
  breachManagementProcess: Joi.string(),
  vulnerabilityManagement: Joi.string(),
  exposeVeteranInformationToThirdParties: Joi.boolean(),
  thirdPartyInfoDescription: Joi.string(),
  scopesAccessRequested: Joi.array().items(Joi.string()),
  distributingAPIKeysToCustomers: Joi.boolean().required(),
  namingConvention: Joi.string(),
  centralizedBackendLog: Joi.string(),
  listedOnMyHealthApplication: Joi.boolean(),
}).options({ abortEarly: false });

type ProductionAccessRequest = Request<Record<string, unknown>, Record<string, unknown>, ProductionAccessSupportEmail, Record<string, unknown>>;

export default function productionRequestHandler( govdelivery: GovDeliveryService | undefined) {
  return async function (
    req: ProductionAccessRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (govdelivery) {
        logger.info({ message: 'sending production access email to support' });
        await govdelivery.sendProductionAccessEmail(req.body);
        logger.info({message: 'sending production access email to consumer'});
        await govdelivery.sendProductionAccessConsumerEmail(req.body['statusUpdateEmails']);
        res.sendStatus(200);
      }
    } catch (err: unknown) {
      (err as DevPortalError).action = 'sending govdelivery production access request notification';
      next(err);
    }
  };
}
