import { Request, Response } from 'express';
import { DynamoDB } from 'aws-sdk';
import KongService from '../services/KongService';
import GovDeliveryService from '../services/GovDeliveryService';
import SlackService from '../services/SlackService';
import OktaService from '../services/OktaService';
import developerApplicationHandler from '../routes/DeveloperApplication';

// The mocking that follows that is outside of the describe block is
// to create a user model that can have its return values overriden for
// each test.
const mockSaveToKong = jest.fn();
const mockSaveToDynamo = jest.fn();
const mockSaveToOkta = jest.fn();
const mockShouldUpdateKong = jest.fn().mockReturnValue(false);
const mockShouldUpdateOkta = jest.fn().mockReturnValue(false);
const mockSendEmail = jest.fn();
const mockSendSlackSuccess = jest.fn();

let stubOAuthCreds;
let stubToken;

jest.mock('../models/User', () => {
  return jest.fn().mockImplementation(() => {
    return {
      saveToKong: mockSaveToKong,
      saveToDynamo: mockSaveToDynamo,
      saveToOkta: mockSaveToOkta,
      sendEmail: mockSendEmail,
      sendSlackSuccess: mockSendSlackSuccess,
      shouldUpdateKong: mockShouldUpdateKong,
      shouldUpdateOkta: mockShouldUpdateOkta,
      token: stubToken,
      oauthApplication: stubOAuthCreds,
    };
  });
});

describe('developerApplicationHandler', () => {
  const kong = {} as KongService;
  const okta = {} as OktaService;
  const dynamo = {} as DynamoDB.DocumentClient;
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
      }
    } as Request;

    stubOAuthCreds = {
      client_id: 'my',
      client_secret: 'precious'
    };

    stubToken = 'onering';

    mockSaveToDynamo.mockReset();
    mockSaveToKong.mockReset();
    mockSaveToOkta.mockReset();
    mockSendEmail.mockReset();
    mockSendSlackSuccess.mockReset();
    stubNext.mockReset();
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
