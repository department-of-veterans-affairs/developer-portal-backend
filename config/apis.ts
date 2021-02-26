import { KeyAuthAPI, OAuthAPI } from '../types';

const oauthAPIList: OAuthAPI[] = [
  {
    name: 'Health API',
    key: 'health',
    authzEndpoint: process.env.AUTHZ_SERVER_HEALTH,
  },
  {
    name: 'Veteran Verification API',
    key: 'verification',
    authzEndpoint: process.env.AUTHZ_SERVER_VERIFICATION,
  },
  {
    name: 'Community Care Eligibility API',
    key: 'communityCare',
    authzEndpoint: process.env.AUTHZ_SERVER_COMMUNITYCARE,
  },
  {
    name: 'Claims API',
    key: 'claims',
    authzEndpoint: process.env.AUTHZ_SERVER_CLAIMS,
  },
];

const keyAuthAPIList: KeyAuthAPI[] = [
  {
    name: 'Benefits Intake API',
    key: 'benefits',
    acl: 'vba_documents',
  },
  {
    name: 'VA Facilities API',
    key: 'facilities',
    acl: 'va_facilities',
  },
  {
    name: 'VA Form API',
    key: 'vaForms',
    acl: 'va_forms',
  },
  {
    name: 'Veteran Confirmation API',
    key: 'confirmation',
    acl: 'veteran_confirmation',
  },
];

export const APIS_TO_ACLS = keyAuthAPIList.reduce((acc,endpoint) => {
  acc[endpoint.key] = endpoint.acl;
  return acc;
}, {});

export const APIS_TO_PROPER_NAMES = [...oauthAPIList, ...keyAuthAPIList].reduce((acc,endpoint) => {
  acc[endpoint.key] = endpoint.name;
  return acc;
}, {});

export const KONG_CONSUMER_APIS: string[] = keyAuthAPIList
  .map((x) => x.key);

export const OKTA_AUTHZ_ENDPOINTS: Record<string, string> = oauthAPIList.reduce((acc,endpoint) => {
  acc[endpoint.key] = endpoint.authzEndpoint;
  return acc;
}, {});

export const OKTA_CONSUMER_APIS: string[] = Object.keys(OKTA_AUTHZ_ENDPOINTS);

export const API_LIST: string[] = KONG_CONSUMER_APIS.concat(OKTA_CONSUMER_APIS);
