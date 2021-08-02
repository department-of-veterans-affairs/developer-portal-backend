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
      'Environment variable GOVDELIVERY_HOST must be defined for ProductionRequest.integration test',
    );
  }

  const govDelivery = nock(process.env.GOVDELIVERY_HOST);

  const supportReq = {
    apis: 'benefits',
    appDescription: 'A social media platform with one room.',
    appImageLink: 'www.one2bindthem.com/assets/app.jpeg',
    appName: 'One to Bind Them',
    breachManagementProcess: 'golem',
    businessModel: 'magical rings >> profit',
    centralizedBackendLog: 'non-existent',
    credentialStorage: 'stored in a volcano on mount doom',
    distributingAPIKeysToCustomers: false,
    exposeVeteranInformationToThirdParties: false, // eslint-disable-line id-length
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
    signUpLink: ['www.one2bindthem.com/signup'],
    statusUpdateEmails: ['sam@fellowship.com'],
    supportLink: ['www.one2bindthem.com/support'],
    thirdPartyInfoDescription: 'n/a',
    valueProvided: 'n/a',
    vasiSystemName: 'asdf',
    veteranFacing: false,
    veteranFacingDescription:
      'Now the Elves made many rings; but secretly Sauron made One Ring to rule all the others, and their power was bound up with it, to be subject wholly to it and to last only so long as it too should last.',
    vulnerabilityManagement: 'golem',
    website: 'www.one2bindthem.com',
  };

  it('sends a 400 response and descriptive errors if validations fail', async () => {
    const response = await request.post(route).send({
      apis: 'benefits',
      appDescription: 'A social media platform with one room.',
      appName: 'One to Bind Them',
      breachManagementProcess: 'golem',
      businessModel: 'magical rings >> profit',
      centralizedBackendLog: 'non-existent',
      credentialStorage: 'stored in a volcano on mount doom',
      distributingAPIKeysToCustomers: false,
      exposeVeteranInformationToThirdParties: false, // eslint-disable-line id-length
      listedOnMyHealthApplication: false,
      monitizationExplanation: 'n/a',
      platforms: 'iOS',
      signUpLink: ['www.one2bindthem.com/signup'],
      supportLink: ['www.one2bindthem.com/support'],
      vasiSystemName: 'asdf',
      veteranFacing: false,
      veteranFacingDescription:
        'Now the Elves made many rings; but secretly Sauron made One Ring to rule all the others, and their power was bound up with it, to be subject wholly to it and to last only so long as it too should last.',
      vulnerabilityManagement: 'golem',
      website: 'www.one2bindthem.com',
    });

    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      errors: ['"primaryContact" is required', '"secondaryContact" is required'],
    });
  });

  it('sends 200 when passed valid parameters and sends email from GovDelivery', async () => {
    govDelivery.post('/messages/email').reply(200);

    govDelivery.post('/messages/email').reply(200);

    const response = await request.post(route).send(supportReq);

    expect(response.status).toEqual(200);
  });

  it('sends error message on 500 status', async () => {
    govDelivery.post('/messages/email').reply(500);

    const response = await request.post(route).send(supportReq);
    const { action, message } = response.body as DevPortalError;

    expect(response.status).toEqual(500);
    expect(action).toEqual('sending govdelivery production access request notification');
    expect(message).toEqual('Request failed with status code 500');
  });
});
