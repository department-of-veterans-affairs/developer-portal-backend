import { Request, Response } from 'express';
import KongService from '../services/KongService';
import GovDeliveryService from '../services/GovDeliveryService';
import SlackService from '../services/SlackService';
import OktaService from '../services/OktaService';
import DynamoService from '../services/DynamoService';
import developerApplicationHandler, { applySchema } from '../routes/DeveloperApplication';

/*
 * The mocking that follows that is outside of the describe block is
 * to create a user model that can have its return values overriden for
 * each test.
 */
const mockGetConsumerNameOrUndefined = jest.fn();
const mockGetSentEmailAddress = jest.fn();
const mockGetTokenOrUndefined = jest.fn();
const mockSaveToKong = jest.fn();
const mockSaveToDynamo = jest.fn();
const mockSaveToOkta = jest.fn();
const mockShouldUpdateKong = jest.fn().mockReturnValue(false);
const mockShouldUpdateOkta = jest.fn().mockReturnValue(false);
const mockSendEmail = jest.fn();
const mockSendSlackSuccess = jest.fn();

let stubOAuthCreds: unknown;
let stubToken: unknown;

jest.mock('../models/User', () =>
  jest.fn().mockImplementation(() => ({
    getConsumerNameOrUndefined: mockGetConsumerNameOrUndefined,
    getSentEmailAddress: mockGetSentEmailAddress,
    getTokenOrUndefined: mockGetTokenOrUndefined,
    oauthApplication: stubOAuthCreds,
    saveToDynamo: mockSaveToDynamo,
    saveToKong: mockSaveToKong,
    saveToOkta: mockSaveToOkta,
    sendEmail: mockSendEmail,
    sendSlackSuccess: mockSendSlackSuccess,
    shouldUpdateKong: mockShouldUpdateKong,
    shouldUpdateOkta: mockShouldUpdateOkta,
    token: stubToken,
  })),
);

describe('developerApplicationHandler', () => {
  const kong = {} as KongService;
  const okta = {} as OktaService;
  const dynamo = {} as DynamoService;
  const govDelivery = {} as GovDeliveryService;
  const slack = {} as SlackService;

  const mockJson = jest.fn();
  const stubRes: Response = {
    json: mockJson,
  } as unknown as Response;

  const stubNext = jest.fn();

  let stubReq;

  beforeEach(() => {
    stubReq = {
      body: {
        apis: 'facilities,verification',
        description: 'save the world',
        email: 'frodo@fellowship.org',
        firstName: 'Frodo',
        lastName: 'Baggins',
        organization: 'Fellowship of the Ring',
        termsOfService: true,
      },
    } as Request;

    stubOAuthCreds = {
      client_id: 'my',
      client_secret: 'precious',
    };

    stubToken = 'onering';
    mockGetConsumerNameOrUndefined.mockReset();
    mockGetSentEmailAddress.mockReset();
    mockGetTokenOrUndefined.mockReset();
    mockJson.mockReset();
    mockSaveToDynamo.mockReset();
    mockSaveToKong.mockReset();
    mockSaveToOkta.mockReset();
    mockSendEmail.mockReset();
    mockSendSlackSuccess.mockReset();
    stubNext.mockReset();
    mockGetTokenOrUndefined.mockReturnValue(stubToken);
  });

  it('signs users up for Kong if they requested access to valid standard APIs', async () => {
    mockShouldUpdateKong.mockReturnValue(true);
    stubOAuthCreds = undefined;

    const handler = developerApplicationHandler(kong, undefined, dynamo, undefined, undefined);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSaveToKong).toHaveBeenCalled();
  });

  it('signs users up for Okta if they requested access to valid OAuth APIs', async () => {
    mockShouldUpdateOkta.mockReturnValue(true);
    stubToken = '';
    mockGetTokenOrUndefined.mockReturnValue(stubToken);
    const handler = developerApplicationHandler(kong, okta, dynamo, undefined, undefined);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSaveToOkta).toHaveBeenCalled();
  });

  it('does not sign up for Okta if no Okta client is provided', async () => {
    mockShouldUpdateOkta.mockReturnValue(true);

    const handler = developerApplicationHandler(kong, undefined, dynamo, undefined, undefined);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSaveToOkta).not.toHaveBeenCalled();
  });

  it('saves details of the signup to DynamoDB', async () => {
    const handler = developerApplicationHandler(kong, undefined, dynamo, undefined, undefined);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSaveToDynamo).toHaveBeenCalled();
  });

  it('renders a token as a response if no OAuth applications were requested', async () => {
    mockShouldUpdateKong.mockReturnValue(true);
    mockShouldUpdateOkta.mockReturnValue(false);
    stubOAuthCreds = undefined;

    const handler = developerApplicationHandler(kong, undefined, dynamo, undefined, undefined);
    await handler(stubReq, stubRes, stubNext);

    expect(mockJson).toHaveBeenCalledWith({ token: 'onering' });
  });

  it('renders a client id, secret, and token if OAuth APIs were requested', async () => {
    mockShouldUpdateKong.mockReturnValue(false);
    mockShouldUpdateOkta.mockReturnValue(true);

    stubToken = '';
    mockGetTokenOrUndefined.mockReturnValue(stubToken);
    const handler = developerApplicationHandler(kong, okta, dynamo, undefined, undefined);
    await handler(stubReq, stubRes, stubNext);

    expect(mockJson).toHaveBeenCalledWith({ clientID: 'my', clientSecret: 'precious', token: '' });
  });

  it('sends an email to the user if the signup succeeded', async () => {
    mockShouldUpdateKong.mockReturnValue(true);

    const handler = developerApplicationHandler(kong, undefined, dynamo, govDelivery, undefined);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSendEmail).toHaveBeenCalled();
  });

  it('sends a message to Slack if the signup succeeded', async () => {
    mockShouldUpdateKong.mockReturnValue(true);

    const handler = developerApplicationHandler(kong, undefined, dynamo, undefined, slack);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSendSlackSuccess).toHaveBeenCalled();
  });

  it('does not send an email if the signup failed', async () => {
    mockShouldUpdateKong.mockReturnValue(true);
    mockSaveToKong.mockRejectedValue('failed saving to Kong');

    const handler = developerApplicationHandler(kong, undefined, dynamo, govDelivery, undefined);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('does not notify Slack if the singup failed', async () => {
    mockShouldUpdateKong.mockReturnValue(true);
    mockSaveToKong.mockRejectedValue(new Error('failed saving to Kong'));

    const handler = developerApplicationHandler(kong, undefined, dynamo, undefined, slack);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSendSlackSuccess).not.toHaveBeenCalled();
  });

  it('renders a successful response even if Slack notifications fail', async () => {
    mockShouldUpdateKong.mockReturnValue(true);
    mockSendSlackSuccess.mockRejectedValue(new Error('failed sending to Slack'));
    stubOAuthCreds = undefined;

    const handler = developerApplicationHandler(kong, undefined, dynamo, undefined, slack);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSendSlackSuccess).toHaveBeenCalled();
    expect(mockJson).toHaveBeenCalledWith({ token: 'onering' });
  });

  it('renders a successful response even if the email fails', async () => {
    mockShouldUpdateKong.mockReturnValue(true);
    mockSendEmail.mockRejectedValue(new Error('failed sending email'));
    stubOAuthCreds = undefined;

    const handler = developerApplicationHandler(kong, undefined, dynamo, govDelivery, undefined);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockJson).toHaveBeenCalledWith({ token: 'onering' });
  });

  it('sends a slack message even if the email fails', async () => {
    mockShouldUpdateKong.mockReturnValue(true);
    mockSendEmail.mockRejectedValue(new Error('failed sending email'));

    const handler = developerApplicationHandler(kong, undefined, dynamo, govDelivery, slack);
    await handler(stubReq, stubRes, stubNext);

    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockSendSlackSuccess).toHaveBeenCalled();
  });

  it('sends signup errors to the default error handler', async () => {
    const err = new Error('failed saving to Kong');
    mockShouldUpdateKong.mockReturnValue(true);
    mockSaveToKong.mockRejectedValue(err);

    const handler = developerApplicationHandler(kong, undefined, dynamo, undefined, slack);
    await handler(stubReq, stubRes, stubNext);

    expect(stubNext).toHaveBeenCalledWith(err);
  });

  it('sends GovDelivery errors to the default error handler', async () => {
    const err = new Error('failed sending email');
    mockShouldUpdateKong.mockReturnValue(true);
    mockSendEmail.mockRejectedValue(err);

    const handler = developerApplicationHandler(kong, undefined, dynamo, govDelivery, undefined);
    await handler(stubReq, stubRes, stubNext);

    expect(stubNext).toHaveBeenCalledWith(err);
  });

  it('sends Slack errors to the default error handler', async () => {
    const err = new Error('failed sending slack message');
    mockShouldUpdateKong.mockReturnValue(true);
    mockSendSlackSuccess.mockRejectedValue(err);

    const handler = developerApplicationHandler(kong, undefined, dynamo, undefined, slack);
    await handler(stubReq, stubRes, stubNext);

    expect(stubNext).toHaveBeenCalledWith(err);
  });
});

describe('validations', () => {
  const defaultPayload = {
    apis: 'benefits',
    email: 'eowyn@rohan.horse',
    firstName: 'Eowyn',
    lastName: 'Eorl',
    organization: 'Rohan',
    termsOfService: true,
  };

  describe('firstName', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, firstName: undefined };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual('"firstName" is required');
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, firstName: 12345 };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual('"firstName" must be a string');
    });
  });

  describe('lastName', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, lastName: undefined };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual('"lastName" is required');
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, lastName: 12345 };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual('"lastName" must be a string');
    });
  });

  describe('organization', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, organization: undefined };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual('"organization" is required');
    });

    it('is a string', () => {
      const payload = { ...defaultPayload, organization: { name: 'Rohan' } };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual('"organization" must be a string');
    });
  });

  describe('description', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, description: 123456789 };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual('"description" must be a string');
    });

    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, description: '' };

      const result = applySchema.validate(payload);

      expect(result.error).toEqual(undefined);
    });
  });

  describe('email', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, email: undefined };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual('"email" is required');
    });

    it('is in a valid format', () => {
      const payload = { ...defaultPayload, email: 'lolnotanemail.com' };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual('"email" must be a valid email');
    });
  });

  describe('oAuthRedirectURI', () => {
    it('is a string', () => {
      const payload = { ...defaultPayload, oAuthRedirectURI: 12345 };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual('"oAuthRedirectURI" must be a string');
    });

    it('is a uri', () => {
      const payload = { ...defaultPayload, oAuthRedirectURI: 'horsiesAreCool' };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual(
        '"oAuthRedirectURI" must be a valid uri with a scheme matching the http|https pattern',
      );
    });

    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, oAuthRedirectURI: '' };

      const result = applySchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  describe('oAuthApplicationType', () => {
    it('is either web or native', () => {
      const payload = { ...defaultPayload, oAuthApplicationType: 'horsies?' };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual('"oAuthApplicationType" must be one of [web, native]');
    });

    it('is allowed to be an empty string', () => {
      const payload = { ...defaultPayload, oAuthApplicationType: '' };

      const result = applySchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  describe('termsOfService', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, termsOfService: undefined };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual('"termsOfService" is required');
    });

    it('requires terms of service were accepted', () => {
      const payload = { ...defaultPayload, termsOfService: false };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual('"termsOfService" must be [true]');
    });
  });

  describe('apis', () => {
    it('is required', () => {
      const payload = { ...defaultPayload, apis: undefined };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual('"apis" is required');
    });

    it('only allows supported api values', () => {
      const payload = { ...defaultPayload, apis: 'benefits,horsies' };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual(
        '"apis" failed custom validation because invalid apis in list: horsies',
      );
    });

    it('gracefully handles non-string types', () => {
      const payload = { ...defaultPayload, apis: 12345 };

      const result = applySchema.validate(payload);

      expect(result.error?.message).toEqual(
        '"apis" failed custom validation because it was unable to process the provided data',
      );
    });
  });

  describe('internalApiInfo', () => {
    const defaultInternalApiInfo = {
      programName: 'Battle of the Hornburg',
      sponsorEmail: 'aragorn@va.gov',
      vaEmail: 'eowyn@va.gov',
    };
    describe('programName', () => {
      it('is required', () => {
        const internalApiInfo = { ...defaultInternalApiInfo, programName: undefined };
        const payload = { ...defaultPayload, internalApiInfo };

        const result = applySchema.validate(payload);

        expect(result.error?.message).toEqual('"internalApiInfo.programName" is required');
      });

      it('is a string', () => {
        const internalApiInfo = { ...defaultInternalApiInfo, programName: 12345 };
        const payload = { ...defaultPayload, internalApiInfo };

        const result = applySchema.validate(payload);

        expect(result.error?.message).toEqual('"internalApiInfo.programName" must be a string');
      });
    });

    describe('sponsorEmail', () => {
      it('is required', () => {
        const internalApiInfo = { ...defaultInternalApiInfo, sponsorEmail: undefined };
        const payload = { ...defaultPayload, internalApiInfo };

        const result = applySchema.validate(payload);

        expect(result.error?.message).toEqual('"internalApiInfo.sponsorEmail" is required');
      });

      it('is a string', () => {
        const internalApiInfo = { ...defaultInternalApiInfo, sponsorEmail: 12345 };
        const payload = { ...defaultPayload, internalApiInfo };

        const result = applySchema.validate(payload);

        expect(result.error?.message).toEqual('"internalApiInfo.sponsorEmail" must be a string');
      });

      it('is in a valid format', () => {
        const internalApiInfo = { ...defaultInternalApiInfo, sponsorEmail: 'lolnotanemail.com' };
        const payload = { ...defaultPayload, internalApiInfo };

        const result = applySchema.validate(payload);

        expect(result.error?.message).toEqual(
          '"internalApiInfo.sponsorEmail" must be a valid email. "internalApiInfo.sponsorEmail" failed custom validation because VA email is not valid. Please check that a real VA email has been submitted',
        );
      });

      it('is in a valid email from the VA', () => {
        const internalApiInfo = {
          ...defaultInternalApiInfo,
          sponsorEmail: 'gloin@son-of-groin.com',
        };
        const payload = { ...defaultPayload, internalApiInfo };

        const result = applySchema.validate(payload);

        expect(result.error?.message).toEqual(
          '"internalApiInfo.sponsorEmail" failed custom validation because VA email is not valid. Please check that a real VA email has been submitted',
        );
      });
    });

    describe('vaEmail', () => {
      it('is a string', () => {
        const internalApiInfo = { ...defaultInternalApiInfo, vaEmail: 12345 };
        const payload = { ...defaultPayload, internalApiInfo };

        const result = applySchema.validate(payload);

        expect(result.error?.message).toEqual('"internalApiInfo.vaEmail" must be a string');
      });

      it('is in a valid format', () => {
        const internalApiInfo = { ...defaultInternalApiInfo, vaEmail: 'lolnotanemail.com' };
        const payload = { ...defaultPayload, internalApiInfo };

        const result = applySchema.validate(payload);

        expect(result.error?.message).toEqual(
          '"internalApiInfo.vaEmail" must be a valid email. "internalApiInfo.vaEmail" failed custom validation because VA email is not valid. Please check that a real VA email has been submitted',
        );
      });

      it('is in a valid email from the VA', () => {
        const internalApiInfo = { ...defaultInternalApiInfo, vaEmail: 'gloin@son-of-groin.com' };
        const payload = { ...defaultPayload, internalApiInfo };

        const result = applySchema.validate(payload);

        expect(result.error?.message).toEqual(
          '"internalApiInfo.vaEmail" failed custom validation because VA email is not valid. Please check that a real VA email has been submitted',
        );
      });
    });
  });

  it('reports multiple failures at a time', () => {
    const payload = { ...defaultPayload, firstName: undefined, lastName: undefined };

    const result = applySchema.validate(payload);

    expect(result.error?.message).toEqual('"firstName" is required. "lastName" is required');
  });
});
