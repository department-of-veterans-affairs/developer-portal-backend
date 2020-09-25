type OAuthEndpoint = {
  properName: string;
  internalName: string;
  authzEndpoint: string | undefined;
};
type KeyBasedEndpoint = {
  properName: string;
  internalName: string;
  acl: string;
};

const oauthEndpointList: OAuthEndpoint[] = [
  {
    properName: "Health API",
    internalName: "health",
    authzEndpoint: process.env.AUTHZ_SERVER_HEALTH,
  },
  {
    properName: "Veteran Verification API",
    internalName: "verification",
    authzEndpoint: process.env.AUTHZ_SERVER_VERIFICATION,
  },
  {
    properName: "Community Care Eligibility API",
    internalName: "communityCare",
    authzEndpoint: process.env.AUTHZ_SERVER_COMMUNITYCARE,
  },
  {
    properName: "Claims API",
    internalName: "claims",
    authzEndpoint: process.env.AUTHZ_SERVER_CLAIMS,
  },
];

const keyBasedEndpointList: KeyBasedEndpoint[] = [
  {
    properName: "Benefits Intake API",
    internalName: "benefits",
    acl: "vba_documents",
  },
  {
    properName: "VA Facilities API",
    internalName: "facilities",
    acl: "va_facilities",
  },
  {
    properName: "VA Form API",
    internalName: "vaForms",
    acl: "va_forms",
  },
  {
    properName: "Veteran Confirmation API",
    internalName: "confirmation",
    acl: "veteran_confirmation",
  },
];

export const apisToAcls = keyBasedEndpointList.reduce((obj, item) => {
  return {
    ...obj,
    [item.internalName]: item.acl,
  };
}, {});

export const APIS_TO_PROPER_NAMES = {};
for (const endpoint of [...oauthEndpointList, ...keyBasedEndpointList]) {
  APIS_TO_PROPER_NAMES[endpoint.internalName] = endpoint.properName;
}

export const KONG_CONSUMER_APIS: string[] = keyBasedEndpointList
  .map((x) => x.internalName);

export const OKTA_AUTHZ_ENDPOINTS = oauthEndpointList
  .reduce((obj, item) => {
    return {
      ...obj,
      [item.internalName]: item.authzEndpoint,
    };
  }, {});

export const OKTA_CONSUMER_APIS: string[] = Object.keys(OKTA_AUTHZ_ENDPOINTS);

export const API_LIST: string[] = KONG_CONSUMER_APIS.concat(OKTA_CONSUMER_APIS);
