export const KONG_CONSUMER_APIS: string[] = [
  'benefits', 
  'facilities', 
  'vaForms', 
  'confirmation',
];

export const OKTA_AUTHZ_ENDPOINTS = {
  health:        process.env.AUTHZ_SERVER_HEALTH,
  verification:  process.env.AUTHZ_SERVER_VERIFICATION,
  communityCare: process.env.AUTHZ_SERVER_COMMUNITYCARE,
  claims:        process.env.AUTHZ_SERVER_CLAIMS,
};

export const OKTA_CONSUMER_APIS: string[] = Object.keys(OKTA_AUTHZ_ENDPOINTS);
