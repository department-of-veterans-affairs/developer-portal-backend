import { KeyAuthAPI, OAuthAPI } from '../types';

const addressValidation: KeyAuthAPI = {
  acl: 'internal-va:address_validation',
  key: 'addressValidation',
  name: 'Address Validation API',
};

const oauthAPIList: OAuthAPI[] = [
  {
    authzEndpoint: process.env.AUTHZ_SERVER_HEALTH,
    key: 'health',
    name: 'Health API',
  },
  {
    authzEndpoint: process.env.AUTHZ_SERVER_VERIFICATION,
    key: 'verification',
    name: 'Veteran Verification API',
  },
  // clinicalHealth is only present in .env.test, and will need to be added for real world use
  {
    authzEndpoint: process.env.AUTHZ_SERVER_CLINICAL_FHIR ?? 'Unknown endpoint',
    key: 'clinicalHealth',
    name: 'Clinical Health API (FHIR)',
  },
  {
    authzEndpoint: process.env.AUTHZ_SERVER_COMMUNITYCARE,
    key: 'communityCare',
    name: 'Community Care Eligibility API',
  },
  {
    authzEndpoint: process.env.AUTHZ_SERVER_CLAIMS,
    key: 'claims',
    name: 'Claims API',
  },
];

const keyAuthAPIList: KeyAuthAPI[] = [
  {
    acl: 'appeals',
    key: 'appeals',
    name: 'Appeals Status API',
  },
  {
    acl: 'vba_documents',
    key: 'benefits',
    name: 'Benefits Intake API',
  },
  {
    acl: 'claims_attributes',
    key: 'claimsAttributes',
    name: 'Claims Attributes API',
  },
  {
    acl: 'hlr',
    key: 'decisionReviews',
    name: 'Decision Reviews API',
  },
  {
    acl: 'va_facilities',
    key: 'facilities',
    name: 'VA Facilities API',
  },
  {
    acl: 'loan_guaranty',
    key: 'loanGuaranty',
    name: 'Loan Guaranty API',
  },
  {
    acl: 'va_forms',
    key: 'vaForms',
    name: 'VA Form API',
  },

  {
    acl: 'veteran_confirmation',
    key: 'confirmation',
    name: 'Veteran Confirmation API',
  },
  addressValidation,
];

const internalOnlyApis: Array<KeyAuthAPI | OAuthAPI> = [addressValidation];

export const APIS_TO_ACLS: Record<string, string> = keyAuthAPIList.reduce((acc, endpoint) => {
  acc[endpoint.key] = endpoint.acl;
  return acc;
}, {});

export const APIS_TO_PROPER_NAMES: Record<string, string> = [
  ...oauthAPIList,
  ...keyAuthAPIList,
].reduce((acc, endpoint) => {
  acc[endpoint.key] = endpoint.name;
  return acc;
}, {});

export const INTERNAL_ONLY_APIS: string[] = internalOnlyApis.map(x => x.key);

export const KONG_CONSUMER_APIS: string[] = keyAuthAPIList.map(x => x.key);

export const OKTA_AUTHZ_ENDPOINTS: Record<string, string> = oauthAPIList.reduce((acc, endpoint) => {
  acc[endpoint.key] = endpoint.authzEndpoint;
  return acc;
}, {});

export const OKTA_CONSUMER_APIS: string[] = Object.keys(OKTA_AUTHZ_ENDPOINTS);

export const API_LIST: string[] = KONG_CONSUMER_APIS.concat(OKTA_CONSUMER_APIS);
