import 'jest';
import supertest from 'supertest';
import nock from 'nock';

import configureApp from '../app';
import { DevPortalError } from '../models/DevPortalError';

const request = supertest(configureApp());
const route = '/internal/developer-portal/public/production_request';

describe(route, () => {
  if (!process.env.GOVDELIVERY_HOST) {
    throw new Error(
      'Environment variable GOVDELIVERY_HOST must be defined for ProductionRequest.integration test'
    );
  }

  const govDelivery = nock(process.env.GOVDELIVERY_HOST);

  const supportReq = {
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
    credentialStorage: 'stored in a volcano on mount doom',
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

  it('sends a 400 response and descriptive errors if validations fail', async () => {
    const response = await request.post(route).send({
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
      credentialStorage: 'stored in a volcano on mount doom',
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
    });

    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      errors: ['"primaryContact" is required', '"secondaryContact" is required'],
    });
  });

  it('sends 200 when passed valid parameters and sends email from GovDelivery', async () => {
    govDelivery
      .post('/messages/email')
      .reply(200);

    govDelivery
      .post('/messages/email')
      .reply(200);

    const response = await request.post(route).send(supportReq);

    expect(response.status).toEqual(200);
  });

  it('sends error message on 500 status', async () => {
    govDelivery
      .post('/messages/email')
      .reply(500);

    const response = await request.post(route).send(supportReq);
    const { action, message } = response.body as DevPortalError;

    expect(response.status).toEqual(500);
    expect(action).toEqual('sending govdelivery production access request notification');
    expect(message).toEqual('Request failed with status code 500');
  });
});

