export const KONG_CONSUMER_APIS: string[] = [
  'benefits', 
  'facilities', 
  'vaForms', 
  'confirmation',
];

export const OKTA_AUTHZ_ENDPOINTS = {
  health:        process.env.OKTA_AUTHZ_HEALTH,
  verification:  process.env.OKTA_AUTHZ_VERIFICATION,
  communityCare: process.env.OKTA_AUTHZ_COMMUNITYCARE,
  claims:        process.env.OKTA_AUTHZ_CLAIMS,
};

export const OKTA_CONSUMER_APIS: string[] = Object.keys(OKTA_AUTHZ_ENDPOINTS);
