import { HistoricalAPI, KeyAuthAPI, OAuthAPI } from '../types';

const addressValidation: KeyAuthAPI = {
  acl: 'internal-va:address_validation',
  key: 'addressValidation',
  name: 'Address Validation API',
};
const appealsStatus: KeyAuthAPI = {
  acl: 'appeals',
  key: 'appeals',
  name: 'Appeals Status API',
};
// clinicalHealth is only present in .env.test, and will need to be added for real world use
const clinicalHealth: OAuthAPI = {
  authzEndpoint: process.env.AUTHZ_SERVER_CLINICAL_FHIR ?? 'Unknown endpoint',
  key: 'clinicalHealth',
  name: 'Clinical Health API (FHIR)',
};

const decisionReviews: KeyAuthAPI = {
  acl: 'hlr',
  key: 'decision_reviews',
  name: 'Decision Reviews API',
};

const loanGuaranty: KeyAuthAPI = {
  acl: 'loan_guaranty',
  key: 'loan_guaranty',
  name: 'Loan Guaranty API',
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
  clinicalHealth,
];

const keyAuthAPIList: KeyAuthAPI[] = [
  {
    acl: 'vba_documents',
    key: 'benefits',
    name: 'Benefits Intake API',
  },
  {
    acl: 'va_facilities',
    key: 'facilities',
    name: 'VA Facilities API',
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
  appealsStatus,
  decisionReviews,
  loanGuaranty,
];

const historicalAPIsList: HistoricalAPI[] = [
  {
    key: 'claimsAttributes',
    name: 'Claims Attributes',
  },
];

const internalOnlyApis: Array<KeyAuthAPI | OAuthAPI> = [
  addressValidation,
  appealsStatus,
  clinicalHealth,
  decisionReviews,
  loanGuaranty,
];

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

export const HISTORICAL_APIS: string[] = historicalAPIsList.map(x => x.key);

export const OKTA_AUTHZ_ENDPOINTS: Record<string, string> = oauthAPIList.reduce((acc, endpoint) => {
  acc[endpoint.key] = endpoint.authzEndpoint;
  return acc;
}, {});

export const OKTA_CONSUMER_APIS: string[] = Object.keys(OKTA_AUTHZ_ENDPOINTS);

export const API_LIST: string[] = KONG_CONSUMER_APIS.concat(OKTA_CONSUMER_APIS);

export const HISTORICAL_API_LIST: string[] = HISTORICAL_APIS.concat(API_LIST);
