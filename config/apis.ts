export const KONG_CONSUMER_APIS: string[] = [
  'benefits', 
  'facilities', 
  'vaForms', 
  'confirmation',
];

export const OKTA_AUTHZ_ENDPOINTS = {
  'health':        'aus7y0ho1w0bSNLDV2p7',
  'verification':  'aus7y0sefudDrg2HI2p7',
  'communityCare': 'aus89xnh1xznM13SK2p7',
  'claims':        'aus7y0lyttrObgW622p7',
};

export const OKTA_CONSUMER_APIS: string[] = Object.keys(OKTA_AUTHZ_ENDPOINTS);
