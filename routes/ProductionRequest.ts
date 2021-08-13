import { Request, Response, NextFunction } from 'express';
import Joi from '@hapi/joi';
import logger from '../config/logger';
import GovDeliveryService from '../services/GovDeliveryService';
import { DevPortalError } from '../models/DevPortalError';
import { validateApiList, emailValidator, validatePhoneFormat } from '../util/validators';
import { ProductionAccessSupportEmail } from '../types/ProductionAccess';

export const productionSchema = Joi.object()
  .keys({
    // APP INFORMATION
    apis: Joi.custom(validateApiList).required(),
    appDescription: Joi.string(),
    appName: Joi.string(),
    website: Joi.string(),
    businessModel: Joi.string().required(),
    phoneNumber: Joi.custom(validatePhoneFormat).required(),
    organization: Joi.string().required(),
    platforms: Joi.string(),
    policyDocuments: Joi.array().items(Joi.string()).required(),
    primaryContact: Joi.object({
      email: Joi.string().email().custom(emailValidator).required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
    }).required(),
    secondaryContact: Joi.object({
      email: Joi.string().email().custom(emailValidator).required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
    }).required(),
    statusUpdateEmails: Joi.array().items(Joi.string().email().custom(emailValidator)).required(),
    valueProvided: Joi.string().required(),
    listedOnMyHealthApplication: Joi.boolean(),
    signUpLink: Joi.array().items(Joi.string()),
    supportLink: Joi.array().items(Joi.string()),
    scopesAccessRequested: Joi.array().items(Joi.string()),
    //PII
    piiStorageMethod: Joi.string(),
    storePIIOrPHI: Joi.boolean().required(),
    multipleReqSafeguards: Joi.string(),
    breachManagementProcess: Joi.string(),
    vulnerabilityManagement: Joi.string(),
    //VETERAN INFORMATION
    veteranFacing: Joi.boolean().required(),
    veteranFacingDescription: Joi.string().max(415),
    monitizationExplanation: Joi.string(),
    monitizedVeteranInformation: Joi.boolean().required(),
    exposeVeteranInformationToThirdParties: Joi.boolean(), // eslint-disable-line id-length
    thirdPartyInfoDescription: Joi.string(),
    // SECURITY
    productionKeyCredentialStorage: Joi.string(),
    productionOrOAuthKeyCredentialStorage: Joi.string(),
    distributingAPIKeysToCustomers: Joi.boolean(),
    namingConvention: Joi.string(),
    centralizedBackendLog: Joi.string(),
    vasiSystemName: Joi.string(),
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
