import { Request, Response } from 'express';
import GovDeliveryService from '../services/GovDeliveryService';
import productionRequestHandler, { productionSchema } from '../routes/ProductionRequest';

// The mocking that follows that is outside of the describe block is
// to create a user model that can have its return values overriden for
// each test.
const mockSendEmail = jest.fn();

let stubToken: unknown;

describe('productionRequestHandler', () => {
  const govDelivery = {} as GovDeliveryService;

  const mockJson = jest.fn();
  const stubRes: Response = {
    json: mockJson,
  } as unknown as Response;

  const stubNext = jest.fn();

  let stubReq;

  beforeEach(() => {
    stubReq = {
      body: {
        primaryContact: {
          firstName: 'Samwise',
          lastName: 'Gamgee',
          email: 'sam@fellowship.com',
        },
        secondaryContact: {
          firstName: 'Frodo',
          lastName: 'Baggins',
          email: 'frodo@fellowship.com',
        },
        organization: 'Sauron.INC',
        appName: 'One to Bind Them',
        appDescription: 'A social media platform with one room.',
        statusUpdateEmails: ['sam@fellowship.com'],
        valueProvided: 'n/a',
        businessModel: 'magical rings >> profit',
        policyDocuments: ['www.example.com/tos'],
        phoneNumber: '867-5309',
        apis: 'benefits',
        monitizedVeteranInformation: false,
        monitizationExplanation: 'n/a',
        veteranFacing: false,
        website: 'www.one2bindthem.com',
        signUpLink: 'www.one2bindthem.com/signup',
        supportLink: 'www.one2bindthem.com/support',
        platforms: ['iOS'],
        veteranFacingDescription: 'Now the Elves made many rings; but secretly Sauron made One Ring to rule all the others, and their power was bound up with it, to be subject wholly to it and to last only so long as it too should last.',
        vasiSystemName: 'asdf',
        credentialStorage: '',
        storePIIOrPHI: false,
        storageMethod: 'Locking away in the fires from whence it came.',
        safeguards: 'golem',
        breachManagementProcess: 'golem',
        vulnerabilityManagement: 'golem',
        exposeHealthInformationToThirdParties: false,
        thirdPartyHealthInfoDescription: 'n/a',
        scopesAccessRequested: ['profile', 'email'],
        distrubitingAPIKeysToCustomers: false,
        namingConvention: 'overly-complicated',
        centralizedBackendLog: 'non-existent',
        listedOnMyHealthApplication: false,
      },
    } as Request;

    stubToken = 'onering';

    mockSendEmail.mockReset();
    stubNext.mockReset();
  });


  it('sends an email', async () => {
    const handler = productionRequestHandler(govDelivery);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSendEmail).toHaveBeenCalled();
  });

  it('renders a successful response even if the email fails', async () => {
    mockSendEmail.mockRejectedValue(new Error('failed sending email'));

    const handler = productionRequestHandler(govDelivery);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockJson).toHaveBeenCalledWith({ token: 'onering' });
  });


  it('sends GovDelivery errors to the default error handler', async () => {
    const err = new Error('failed sending email');
    mockSendEmail.mockRejectedValue(err);

    const handler = productionRequestHandler(govDelivery);
    await handler(stubReq, stubRes, stubNext);

    expect(stubNext).toHaveBeenCalledWith(err);
  });
});

describe('validations', () => {
  const defaultPayload = {
    primaryContact: {
      firstName: 'Samwise',
      lastName: 'Gamgee',
      email: 'sam@fellowship.com',
    },
    secondaryContact: {
      firstName: 'Frodo',
      lastName: 'Baggins',
      email: 'frodo@fellowship.com',
    },
    organization: 'Sauron.INC',
    appName: 'One to Bind Them',
    appDescription: 'A social media platform with one room.',
    statusUpdateEmails: ['sam@fellowship.com'],
    valueProvided: 'n/a',
    businessModel: 'magical rings >> profit',
    policyDocuments: ['www.example.com/tos'],
    phoneNumber: '867-5309',
    apis: 'benefits',
    monitizedVeteranInformation: false,
    monitizationExplanation: 'n/a',
    veteranFacing: false,
    website: 'www.one2bindthem.com',
    signUpLink: 'www.one2bindthem.com/signup',
    supportLink: 'www.one2bindthem.com/support',
    platforms: ['iOS'],
    veteranFacingDescription: 'Now the Elves made many rings; but secretly Sauron made One Ring to rule all the others, and their power was bound up with it, to be subject wholly to it and to last only so long as it too should last.',
    vasiSystemName: 'asdf',
    credentialStorage: '',
    storePIIOrPHI: false,
    storageMethod: 'Locking away in the fires from whence it came.',
    safeguards: 'golem',
    breachManagementProcess: 'golem',
    vulnerabilityManagement: 'golem',
    exposeHealthInformationToThirdParties: false,
    thirdPartyHealthInfoDescription: 'n/a',
    scopesAccessRequested: ['profile', 'email'],
    distrubitingAPIKeysToCustomers: false,
    namingConvention: 'overly-complicated',
    centralizedBackendLog: 'non-existent',
    listedOnMyHealthApplication: false,
  };

  describe('primaryContact', () => {
    it('is required', () => {
      const payload = {...defaultPayload, primaryContact: undefined};

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"primaryContact" is required');
    });

    it('is an object', () => {
      const payload = { ...defaultPayload, primaryContact: 12345 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"firstName" must be an object');
    });
  });

  describe('secondaryContact', () => {
    it('is required', () => {
      const payload = {...defaultPayload, secondaryContact: undefined};

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"secondaryContact" is required');
    });

    it('is an object', () => {
      const payload = { ...defaultPayload, secondaryContact: 12345 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"secondaryContact" must be a object');
    });
  });

  describe('organization', () => {
    it('is required', () => {
      const payload = {...defaultPayload, organization: undefined};

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"organization" is required');
    });

    it('is a string', () => {
      const payload = {...defaultPayload, organization: { name: 'Rohan' }};

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"organization" must be a string');
    });
  });

  describe('appName', () => {
    it('is required', () => {
      const payload = {...defaultPayload, appName: undefined};

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"appName" is required');
    });
    it('is a string', () => {
      const payload = {...defaultPayload, appName: 123456789};

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"appName" must be a string');

    });
  });

  describe('appDescription', () => {
    it('is a string', () => {
      const payload = {...defaultPayload, description: 123456789};

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"appDescription" must be a string');
    });

    it('is required', () => {
      const payload = {...defaultPayload, appDescription: undefined};

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"appDescription" is required');
    });
  });

  describe('statusUpdateEmails', () => {
    it('is is an array', () => {
      const payload = { ...defaultPayload, email: 'lolnotanemail.com' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"statusUpdateEmails" must be an array');
    });
    it('is required', () => {
      const payload = {...defaultPayload, statusUpdateEmails: undefined};

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"email" is required');
    });
  });

  describe('valueProvided', () => {
    it('is required', () => {
      const payload = {...defaultPayload, valueProvided: undefined};

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

    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, businessModel: '' };

      const result = productionSchema.validate(payload);

      expect(result.error).toBe(undefined);
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

      expect(result.error?.message).toEqual('"phoneNumber" must be a string');
    });
  });

  describe('apis', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, apis: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"apis" must be a string');
    });
    it('only allows supported api values', () => {
      const payload = { ...defaultPayload, apis: 'benefits,horsies' };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"apis" failed custom validation because invalid apis in list');
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
    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, monitizationExplanation: '' };

      const result = productionSchema.validate(payload);

      expect(result.error).toEqual(undefined);
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
    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, website: '' };

      const result = productionSchema.validate(payload);

      expect(result.error).toEqual(undefined);
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, website: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"website" must be a string');
    });
  });

  describe('signUpLink', () => {
    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, signUpLink: '' };

      const result = productionSchema.validate(payload);

      expect(result.error).toEqual(undefined);
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, website: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"signUpLink" must be a string');
    });
  });

  describe('supportLink', () => {
    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, supportLink: '' };

      const result = productionSchema.validate(payload);

      expect(result.error).toEqual(undefined);
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, website: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"supportLink" must be a string');
    });
  });

  describe('platforms', () => {
    it('is allowed to be an empty array', () => {
      const payload = { ...defaultPayload, platforms: [] };

      const result = productionSchema.validate(payload);

      expect(result.error).toEqual(undefined);
    });

    it('is an array', () => {
      const payload = { ...defaultPayload, platforms: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"platforms" must be an array');
    });
  });

  describe('veteranFacingDescription', () => {
    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, veteranFacingDescription: '' };

      const result = productionSchema.validate(payload);

      expect(result.error).toEqual(undefined);
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, veteranFacingDescription: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"veteranFacingDescription" must be a string');
    });
  });

  describe('vasiSystemName', () => {
    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, vasiSystemName: '' };

      const result = productionSchema.validate(payload);

      expect(result.error).toEqual(undefined);
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, vasiSystemName: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"vasiSystemName" must be a string');
    });
  });

  describe('credentialStorage', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, vasiSystemName: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error).toEqual('"credentialStorage" is required');
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, credentialStorage: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"credentialStorage" must be a string');
    });
  });

  describe('storePIIOrPHI', () => {
    it('is allowed to be an undefined', () => {
      const payload = { ...defaultPayload, storePIIOrPHI: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error).toEqual(undefined);
    });

    it('is a boolean', () => {
      const payload = { ...defaultPayload, storePIIOrPHI: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"storePIIOrPHI" must be a boolean');
    });
  });

  describe('storageMethod', () => {
    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, storageMethod: '' };

      const result = productionSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
    it('is a string', () => {
      const payload = { ...defaultPayload, storageMethod: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"storageMethod" must be a string');
    });
  });

  describe('safeguards', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, safeguards: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"safeguards" must be a string');
    });
    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, safeguards: '' };

      const result = productionSchema.validate(payload);

      expect(result.error).toBe(undefined);
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

      expect(result.error).toBe(undefined);
    });
  });

  describe('vulnerabilityManagement', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, vulnerabilityManagement: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"vulnerabilityManagement" must be a string');
    });
    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, vulnerabilityManagement: '' };

      const result = productionSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  describe('exposeHealthInformationToThirdParties', () => {
    it('is a boolean', () => {
      const payload = { ...defaultPayload, exposeHealthInformationToThirdParties: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"exposeHealthInformationToThirdParties" must be a boolean');
    });
    it('is allowed to be undefined', () => {
      const payload = { ...defaultPayload, exposeHealthInformationToThirdParties: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  describe('thirdPartyHealthInfoDescription', () => {
    it('is a boolean', () => {
      const payload = { ...defaultPayload, thirdPartyHealthInfoDescription: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"thirdPartyHealthInfoDescription" must be a string');
    });
    it('is allowed to be undefined', () => {
      const payload = { ...defaultPayload, thirdPartyHealthInfoDescription: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  describe('scopesAccessRequested', () => {
    it('is an array', () => {
      const payload = { ...defaultPayload, scopesAccessRequested: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"scopesAccessRequested" must be an array');
    });
    it('is allowed to be undefined', () => {
      const payload = { ...defaultPayload, thirdPartyHealthInfoDescription: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  describe('distrubitingAPIKeysToCustomers', () => {
    it('is an boolean', () => {
      const payload = { ...defaultPayload, distrubitingAPIKeysToCustomers: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"distrubitingAPIKeysToCustomers" must be a boolean');
    });
    it('is allowed to be undefined', () => {
      const payload = { ...defaultPayload, distrubitingAPIKeysToCustomers: undefined };

      const result = productionSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  describe('namingConvention', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, namingConvention: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"namingConvention" must be a string');
    });
    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, namingConvention: '' };

      const result = productionSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  describe('centralizedBackendLog', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, centralizedBackendLog: 123456 };

      const result = productionSchema.validate(payload);

      expect(result.error?.message).toEqual('"centralizedBackendLog" must be a string');
    });
    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, centralizedBackendLog: '' };

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
    const payload = {...defaultPayload, primaryContact: undefined, secondaryContact: undefined};

    const result = productionSchema.validate(payload);

    expect(result.error?.message).toEqual('"primaryContact" is required. "secondaryContact" is required');
  });
});
