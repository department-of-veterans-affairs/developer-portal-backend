import { Request, Response, NextFunction } from 'express';
import Joi from '@hapi/joi';
import logger from '../config/logger';
import GovDeliveryService from '../services/GovDeliveryService';
import { DevPortalError } from '../models/DevPortalError';
import {validateApiList} from './DeveloperApplication';

export const productionSchema = Joi.object().keys({
  primaryContact: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required(),
  }).required(),
  secondaryContact: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required(),
  }).required(),
  organization: Joi.string().required(),
  appName: Joi.string().required(),
  appDescription: Joi.string().required(),
  statusUpdateEmails: Joi.array().items(Joi.string()).required(),
  valueProvided: Joi.string().required(),
  businessModel: Joi.string(),
  policyDocuments: Joi.array().items(Joi.string()).required(),
  phoneNumber: Joi.string().required(),
  apis: Joi.custom(validateApiList).required(),
  monitizedVeteranInformation: Joi.boolean().required(),
  monitizationExplanation: Joi.string(),
  veteranFacing: Joi.boolean(),
  website: Joi.string(),
  signUpLink: Joi.string(),
  supportLink: Joi.string(),
  platforms: Joi.array().items(Joi.string()),
  veteranFacingDescription: Joi.string(),
  vasiSystemName: Joi.string(),
  credentialStorage: Joi.string().required(),
  storePIIOrPHI: Joi.boolean().required(),
  storageMethod: Joi.string(),
  safeguards: Joi.string(),
  breachManagementProcess: Joi.string(),
  vulnerabilityManagement: Joi.string(),
  exposeHealthInformationToThirdParties: Joi.boolean(),
  thirdPartyHealthInfoDescription: Joi.string(),
  scopesAccessRequested: Joi.array().items(Joi.string()),
  distrubitingAPIKeysToCustomers: Joi.boolean(),
  namingConvention: Joi.string(),
  centralizedBackendLog: Joi.string(),
  listedOnMyHealthApplication: Joi.boolean(),
}).options({ abortEarly: false });

interface ContactDetails {
  firstName: string;
  lastName: string;
  email: string;
}

interface ProductionAccessBody {
  primaryContact: ContactDetails;
  secondaryContact: ContactDetails;
  organization: string;
  appName: string;
  appDescription: string;
  statusUpdateEmails: string[];
  valueProvided: string;
  businessModel?: string;
  policyDocuments: string[];
  phoneNumber: string;
  apis?: string;
  monitizedVeteranInformation: boolean;
  monitizationExplanation?: string;
  veteranFacing?: boolean;
  website?: string;
  signUpLink?: string;
  supportLink?: string;
  platforms?: string[];
  veteranFacingDescription?: string;
  vasiSystemName?: string;
  credentialStorage: string;
  storePIIOrPHI: boolean;
  storageMethod?: string;
  safeguards?: string;
  breachManagementProcess?: string;
  vulnerabilityManagement?: string;
  exposeHealthInformationToThirdParties?: boolean;
  thirdPartyHealthInfoDescription?: string;
  scopesAccessRequested?: string[];
  distrubitingAPIKeysToCustomers?: boolean;
  namingConvention?: string;
  centralizedBackendLog?: string;
  listedOnMyHealthApplication?: boolean;
}
type ProductionAccessRequest = Request<Record<string, unknown>, Record<string, unknown>, ProductionAccessBody, Record<string, unknown>>;

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
      }
    } catch (err: unknown) {
      (err as DevPortalError).action = 'sending govdelivery production access request notification';
      next(err);
    }
  };
}

