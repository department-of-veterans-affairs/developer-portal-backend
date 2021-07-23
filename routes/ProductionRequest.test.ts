/* eslint-disable id-length */

import { Request, Response } from 'express';
import GovDeliveryService from '../services/GovDeliveryService';
import productionRequestHandler, { productionSchema } from '../routes/ProductionRequest';

/*
 * The mocking that follows that is outside of the describe block is
 * to create a user model that can have its return values overriden for
 * each test.
 */
const mockSendEmail = jest.fn();

describe('productionRequestHandler', () => {
  const mockSendProductionAccessConsumerEmail = jest.fn();
  const mockSendProductionAccessEmail = jest.fn();
  const govDelivery = {
    sendProductionAccessConsumerEmail: mockSendProductionAccessConsumerEmail,
    sendProductionAccessEmail: mockSendProductionAccessEmail,
  } as unknown as GovDeliveryService;

  const mockJson = jest.fn();
  const stubRes: Response = {
    json: mockJson,
  } as unknown as Response;

  const stubNext = jest.fn();

  let stubReq;

  beforeEach(() => {
    stubReq = {
      body: {
        apis: 'benefits',
        appDescription: 'A social media platform with one room.',
        appImageLink: 'www.one2bindthem.com/assets/app.jpeg',
        appName: 'One to Bind Them',
        breachManagementProcess: 'golem',
        businessModel: 'magical rings >> profit',
        centralizedBackendLog: 'non-existent',
        credentialStorage: 'stored in a volcano on mount doom',
        distributingAPIKeysToCustomers: false,
        exposeVeteranInformationToThirdParties: false,
        listedOnMyHealthApplication: false,
        medicalDisclaimerImageLink: 'www.one2bindthem.com/assets/medicalDisclaimer.jpeg',
        monitizationExplanation: 'n/a',
        monitizedVeteranInformation: false,
        multipleReqSafeguards: 'golem',
        namingConvention: 'overly-complicated',
        organization: 'Sauron.INC',
        patientWaitTimeImageLink: 'www.one2bindthem.com/assets/patientWaitTime.jpeg',
        phoneNumber: '555-867-5309',
        piiStorageMethod: 'Locking away in the fires from whence it came.',
        platforms: 'iOS',
        policyDocuments: ['www.example.com/tos'],
        primaryContact: {
          email: 'sam@fellowship.com',
          firstName: 'Samwise',
          lastName: 'Gamgee',
        },
        scopesAccessRequested: ['profile', 'email'],
        secondaryContact: {
          email: 'frodo@fellowship.com',
          firstName: 'Frodo',
          lastName: 'Baggins',
        },
        signUpLink: 'www.one2bindthem.com/signup',
        statusUpdateEmails: ['sam@fellowship.com'],
        storePIIOrPHI: false,
        supportLink: 'www.one2bindthem.com/support',
        thirdPartyInfoDescription: 'n/a',
        valueProvided: 'n/a',
        vasiSystemName: 'asdf',
        veteranFacing: false,
        veteranFacingDescription:
          'Now the Elves made many rings; but secretly Sauron made One Ring to rule all the others, and their power was bound up with it, to be subject wholly to it and to last only so long as it too should last.',
        vulnerabilityManagement: 'golem',
        website: 'www.one2bindthem.com',
      },
    } as Request;

    mockSendEmail.mockReset();
    stubNext.mockReset();
  });

  it('sends an email', async () => {
    const handler = productionRequestHandler(govDelivery);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSendProductionAccessEmail).toHaveBeenCalled();
    expect(mockSendProductionAccessConsumerEmail).toHaveBeenCalled();
  });

  it('renders a successful response even if the email fails', async () => {
    mockSendEmail.mockRejectedValue(new Error('failed sending email'));

    const handler = productionRequestHandler(govDelivery);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSendProductionAccessEmail).toHaveBeenCalled();
    expect(mockSendProductionAccessConsumerEmail).toHaveBeenCalled();
  });
});

describe('validations', () => {
  const defaultPayload = {
    apis: 'benefits',
    appDescription: 'A social media platform with one room.',
    appName: 'One to Bind Them',
    breachManagementProcess: 'golem',
    businessModel: 'magical rings >> profit',
    centralizedBackendLog: 'non-existent',
    credentialStorage: 'stored in a volcano on mount doom',
    distributingAPIKeysToCustomers: false,
    exposeVeteranInformationToThirdParties: false,
    listedOnMyHealthApplication: false,
    monitizationExplanation: 'n/a',
    monitizedVeteranInformation: false,
    multipleReqSafeguards: 'golem',
    namingConvention: 'overly-complicated',
    organization: 'Sauron.INC',
    phoneNumber: '555-867-5309',
    piiStorageMethod: 'Locking away in the fires from whence it came.',
    platforms: 'iOS',
    policyDocuments: ['www.example.com/tos'],
    primaryContact: {
      email: 'sam@fellowship.com',
      firstName: 'Samwise',
      lastName: 'Gamgee',
    },
    scopesAccessRequested: ['profile', 'email'],
    secondaryContact: {
      email: 'frodo@fellowship.com',
      firstName: 'Frodo',
      lastName: 'Baggins',
    },
    signUpLink: 'www.one2bindthem.com/signup',
    statusUpdateEmails: ['sam@fellowship.com'],
    storePIIOrPHI: false,
    supportLink: 'www.one2bindthem.com/support',
    thirdPartyInfoDescription: 'n/a',
    valueProvided: 'n/a',
    vasiSystemName: 'asdf',
    veteranFacing: false,
    veteranFacingDescription:
      'Now the Elves made many rings; but secretly Sauron made One Ring to rule all the others, and their power was bound up with it, to be subject wholly to it and to last only so long as it too should last.',
    vulnerabilityManagement: 'golem',
    website: 'www.one2bindthem.com',
  };

  describe('primaryContact', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, primaryContact: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"primaryContact" is required');
    });

    it('is an object', () => {
      const payload = { ...defaultPayload, primaryContact: 12345 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"primaryContact" must be of type object');
    });
  });

  describe('secondaryContact', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, secondaryContact: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"secondaryContact" is required');
    });

    it('is an object', () => {
      const payload = { ...defaultPayload, secondaryContact: 12345 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"secondaryContact" must be of type object');
    });
  });

  describe('organization', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, organization: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"organization" is required');
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, organization: { name: 'Rohan' } };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"organization" must be a string');
    });
  });

  describe('appName', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, appName: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"appName" is required');
    });
    it('is a string', () => {
      const payload = { ...defaultPayload, appName: 123456789 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"appName" must be a string');
    });
  });

  describe('appDescription', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, appDescription: 123456789 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"appDescription" must be a string');
    });

    it('is required', () => {
      const payload = { ...defaultPayload, appDescription: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"appDescription" is required');
    });
  });

  describe('statusUpdateEmails', () => {
    it('is is an array', () => {
      const payload = { ...defaultPayload, statusUpdateEmails: 'lolnotanemail.com' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"statusUpdateEmails" must be an array');
    });
    it('is required', () => {
      const payload = { ...defaultPayload, statusUpdateEmails: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"statusUpdateEmails" is required');
    });
  });

  describe('valueProvided', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, valueProvided: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"valueProvided" is required');
    });
    it('is a string', () => {
      const payload = { ...defaultPayload, valueProvided: 12345 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"valueProvided" must be a string');
    });
  });

  describe('businessModel', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, businessModel: 12345 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"businessModel" must be a string');
    });

    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, businessModel: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toBe('"businessModel" is not allowed to be empty');
    });
  });

  describe('policyDocuments', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, policyDocuments: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"policyDocuments" is required');
    });

    it('is an array', () => {
      const payload = { ...defaultPayload, policyDocuments: false };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"policyDocuments" must be an array');
    });
  });

  describe('phoneNumber', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, phoneNumber: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"phoneNumber" is required');
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, phoneNumber: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual(
        '"phoneNumber" failed custom validation because phone number format invalid. Valid format examples: 222-333-4444, (222) 333-4444, 2223334444',
      );
    });
  });

  describe('apis', () => {
    it('only allows supported api values', () => {
      const payload = { ...defaultPayload, apis: 'benefits,horsies' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual(
        '"apis" failed custom validation because invalid apis in list',
      );
    });
  });

  describe('monitizedVeteranInformation', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, monitizedVeteranInformation: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"monitizedVeteranInformation" is required');
    });

    it('is a boolean', () => {
      const payload = { ...defaultPayload, monitizedVeteranInformation: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"monitizedVeteranInformation" must be a boolean');
    });
  });

  describe('monitizationExplanation', () => {
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, monitizationExplanation: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"monitizationExplanation" is not allowed to be empty');
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, monitizationExplanation: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"monitizationExplanation" must be a string');
    });
  });

  describe('veteranFacing', () => {
    it('is allowed to be undefined', () => {
      const payload = { ...defaultPayload, monitizationExplanation: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error).toEqual(undefined);
    });

    it('is a boolean', () => {
      const payload = { ...defaultPayload, veteranFacing: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"veteranFacing" must be a boolean');
    });
  });

  describe('website', () => {
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, website: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"website" is not allowed to be empty');
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, website: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"website" must be a string');
    });
  });

  describe('signUpLink', () => {
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, signUpLink: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"signUpLink" is not allowed to be empty');
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, signUpLink: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"signUpLink" must be a string');
    });
  });

  describe('supportLink', () => {
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, supportLink: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"supportLink" is not allowed to be empty');
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, supportLink: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"supportLink" must be a string');
    });
  });

  describe('platforms', () => {
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, platforms: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"platforms" is not allowed to be empty');
    });

    it('is an array', () => {
      const payload = { ...defaultPayload, platforms: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"platforms" must be a string');
    });
  });

  describe('veteranFacingDescription', () => {
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, veteranFacingDescription: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual(
        '"veteranFacingDescription" is not allowed to be empty',
      );
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, veteranFacingDescription: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"veteranFacingDescription" must be a string');
    });
  });

  describe('vasiSystemName', () => {
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, vasiSystemName: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"vasiSystemName" is not allowed to be empty');
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, vasiSystemName: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"vasiSystemName" must be a string');
    });
  });

  describe('credentialStorage', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, credentialStorage: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"credentialStorage" must be a string');
    });
  });

  describe('storePIIOrPHI', () => {
    it('is a boolean', () => {
      const payload = { ...defaultPayload, storePIIOrPHI: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"storePIIOrPHI" must be a boolean');
    });
  });

  describe('piiStorageMethod', () => {
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, piiStorageMethod: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toBe('"piiStorageMethod" is not allowed to be empty');
    });
    it('is a string', () => {
      const payload = { ...defaultPayload, piiStorageMethod: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"piiStorageMethod" must be a string');
    });
  });

  describe('multipleReqSafeguards', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, multipleReqSafeguards: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"multipleReqSafeguards" must be a string');
    });
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, multipleReqSafeguards: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toBe('"multipleReqSafeguards" is not allowed to be empty');
    });
  });

  describe('breachManagementProcess', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, breachManagementProcess: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"breachManagementProcess" must be a string');
    });
    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, breachManagementProcess: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toBe('"breachManagementProcess" is not allowed to be empty');
    });
  });

  describe('vulnerabilityManagement', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, vulnerabilityManagement: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"vulnerabilityManagement" must be a string');
    });
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, vulnerabilityManagement: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toBe('"vulnerabilityManagement" is not allowed to be empty');
    });
  });

  describe('exposeVeteranInformationToThirdParties', () => {
    it('is a boolean', () => {
      const payload = { ...defaultPayload, exposeVeteranInformationToThirdParties: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual(
        '"exposeVeteranInformationToThirdParties" must be a boolean',
      );
    });
  });

  describe('thirdPartyInfoDescription', () => {
    it('is a boolean', () => {
      const payload = { ...defaultPayload, thirdPartyInfoDescription: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"thirdPartyInfoDescription" must be a string');
    });
  });

  describe('scopesAccessRequested', () => {
    it('is an array', () => {
      const payload = { ...defaultPayload, scopesAccessRequested: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"scopesAccessRequested" must be an array');
    });
  });

  describe('distributingAPIKeysToCustomers', () => {
    it('is an boolean', () => {
      const payload = { ...defaultPayload, distributingAPIKeysToCustomers: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"distributingAPIKeysToCustomers" must be a boolean');
    });
    it('is required', () => {
      const payload = { ...defaultPayload, distributingAPIKeysToCustomers: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toBe('"distributingAPIKeysToCustomers" is required');
    });
  });

  describe('namingConvention', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, namingConvention: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"namingConvention" must be a string');
    });
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, namingConvention: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toBe('"namingConvention" is not allowed to be empty');
    });
  });

  describe('centralizedBackendLog', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, centralizedBackendLog: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"centralizedBackendLog" must be a string');
    });
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, centralizedBackendLog: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toBe('"centralizedBackendLog" is not allowed to be empty');
    });
  });

  describe('appImageLink', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, appImageLink: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"appImageLink" must be a string');
    });
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, appImageLink: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toBe('"appImageLink" is not allowed to be empty');
    });
    it('is allowed to be undefined', () => {
      const payload = { ...defaultPayload, appImageLink: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  describe('medicalDisclaimerImageLink', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, medicalDisclaimerImageLink: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"medicalDisclaimerImageLink" must be a string');
    });
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, medicalDisclaimerImageLink: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toBe('"medicalDisclaimerImageLink" is not allowed to be empty');
    });
    it('is allowed to be undefined', () => {
      const payload = { ...defaultPayload, medicalDisclaimerImageLink: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  describe('patientWaitTimeImageLink', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, patientWaitTimeImageLink: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"patientWaitTimeImageLink" must be a string');
    });
    it('is not allowed to be an empty string', () => {
      const payload = { ...defaultPayload, patientWaitTimeImageLink: '' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toBe('"patientWaitTimeImageLink" is not allowed to be empty');
    });
    it('is allowed to be undefined', () => {
      const payload = { ...defaultPayload, patientWaitTimeImageLink: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  describe('listedOnMyHealthApplication', () => {
    it('is a boolean', () => {
      const payload = { ...defaultPayload, listedOnMyHealthApplication: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"listedOnMyHealthApplication" must be a boolean');
    });
    it('is allowed to be undefined', () => {
      const payload = { ...defaultPayload, listedOnMyHealthApplication: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  it('reports multiple failures at a time', () => {
    const payload = { ...defaultPayload, primaryContact: undefined, secondaryContact: undefined };

    const result = productionSchema.validate(payload);

    expect(result.error?.message).toEqual(
      '"primaryContact" is required. "secondaryContact" is required',
    );
  });
});
