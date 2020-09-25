export const apisToAcls = {
  appeals: 'appeals',
  benefits: 'vba_documents',
  confirmation: 'veteran_confirmation',
  facilities: 'va_facilities',
  vaForms: 'va_forms',
  verification: 'veteran_verification',
};

export const APIS_TO_PROPER_NAMES = {
  appeals: 'Appeals Status API',
  benefits: 'Benefits Intake API',
  claims: 'Claims API',
  communityCare: 'Community Care Eligibility API',
  confirmation: 'Veteran Confirmation API',
  facilities: 'VA Facilities API',
  health: 'Health API',
  vaForms: 'VA Form API',
  verification: 'Veteran Verification API',
};

export const API_LIST = [
  'benefits',
  'claims',
  'communityCare',
  'confirmation',
  'facilities',
  'health',
  'vaForms',
  'verification',
];

export const KONG_CONSUMER_APIS: string[] = [
  'benefits',
  'facilities',
  'vaForms',
  'confirmation',
];

export const OKTA_AUTHZ_ENDPOINTS = {
  health: process.env.AUTHZ_SERVER_HEALTH,
  verification: process.env.AUTHZ_SERVER_VERIFICATION,
  communityCare: process.env.AUTHZ_SERVER_COMMUNITYCARE,
  claims: process.env.AUTHZ_SERVER_CLAIMS,
};

export const OKTA_CONSUMER_APIS: string[] = Object.keys(OKTA_AUTHZ_ENDPOINTS);
