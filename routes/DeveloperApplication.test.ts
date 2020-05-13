import { Request, Response, NextFunction } from 'express';
import { DynamoDB } from 'aws-sdk';
import KongService from '../services/KongService';
import GovDeliveryService from '../services/GovDeliveryService';
import SlackService from '../services/SlackService';
import OktaService from '../services/OktaService';
import developerApplicationHandler from '../routes/DeveloperApplication';

const mockSaveToKong = jest.fn();
const mockSaveToDynamo = jest.fn();
const mockSaveToOkta = jest.fn();
const mockShouldUpdateKong = jest.fn().mockReturnValue(false);
const mockShouldUpdateOkta = jest.fn().mockReturnValue(false);
let stubOAuthCreds;
let stubToken;

jest.mock('../models/User', () => {
  return jest.fn().mockImplementation(() => {
    return {
      saveToKong: mockSaveToKong,
      saveToDynamo: mockSaveToDynamo,
      saveToOkta: mockSaveToOkta,
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
  
  const stubNext = jest.fn() as NextFunction;
  
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

    mockJson.mockReset();
    mockSaveToDynamo.mockReset();
    mockSaveToKong.mockReset();
    mockSaveToOkta.mockReset();
  });

  it('pulls values from the body to create a user', () => {
    
  });

  it('signs users up for Kong if they requested access to valid standard APIs', async () => {
    stubReq.body.apis = 'facilities';
    mockShouldUpdateKong.mockReturnValue(true);
    stubOAuthCreds = undefined;

    const handler = developerApplicationHandler(kong, undefined, dynamo, undefined, undefined);
    await handler(stubReq, stubRes, stubNext);

    expect(mockJson).toHaveBeenCalledWith({ token: 'onering' });
    expect(mockSaveToKong).toHaveBeenCalled();
  });

  it('signs users up for Okta if they requested access to valid OAuth APIs', async () => {
    stubReq.body.apis = 'verification';
    mockShouldUpdateOkta.mockReturnValue(true);
    stubToken = '';

    const handler = developerApplicationHandler(kong, okta, dynamo, undefined, undefined);
    await handler(stubReq, stubRes, stubNext);

    expect(mockJson).toHaveBeenCalledWith({ clientID: 'my', clientSecret: 'precious', token: ''});
    expect(mockSaveToOkta).toHaveBeenCalled();
  });

  it('does not sign up for Okta if no Okta client is provided', () => {

  });

  it('saves details of the signup to DynamoDB', () => {

  });

  it('renders a token as a response if no OAuth applications were requested', () => {

  });

  it('renders a client id, secret, and token if OAuth APIs were requested', () => {

  });

  it('sends an email to the user if the signup succeeded', () => {

  });

  it('sends a message to Slack if the signup succeeded', () => {

  });

  it('does not send an email if the signup failed', () => {
  });

  it('does not notify Slack if the singup failed', () => {

  });

  it('renders a successful response even if Slack notifications fail', () => {

  });

  it('renders a successful response even if the email fails', () => {

  });

  it('sends any errors to the default error handler', () => {

  });
});