type OAuthEndpoint = {
  oauthEndpoint: true;
  properName: string;
  internalName: string;
  authzEndpoint: string | undefined;
};
type KeyBasedEndpoint = {
  oauthEndpoint: false;
  properName: string;
  internalName: string;
  acl: string;
};

type ApiEndpoint = OAuthEndpoint | KeyBasedEndpoint;

const apiEndpointList: ApiEndpoint[] = [
  {
    oauthEndpoint: true,
    properName: "Health API",
    internalName: "health",
    authzEndpoint: process.env.AUTHZ_SERVER_HEALTH,
  },
  {
    oauthEndpoint: true,
    properName: "Veteran Verification API",
    internalName: "verification",
    authzEndpoint: process.env.AUTHZ_SERVER_VERIFICATION,
  },
  {
    oauthEndpoint: true,
    properName: "Community Care Eligibility API",
    internalName: "communityCare",
    authzEndpoint: process.env.AUTHZ_SERVER_COMMUNITYCARE,
  },
  {
    oauthEndpoint: true,
    properName: "Claims API",
    internalName: "claims",
    authzEndpoint: process.env.AUTHZ_SERVER_CLAIMS,
  },

  {
    oauthEndpoint: false,
    properName: "Benefits Intake API",
    internalName: "benefits",
    acl: "vba_documents",
  },
  {
    oauthEndpoint: false,
    properName: "VA Facilities API",
    internalName: "facilities",
    acl: "va_facilities",
  },
  {
    oauthEndpoint: false,
    properName: "VA Form API",
    internalName: "vaForms",
    acl: "va_forms",
  },
  {
    oauthEndpoint: false,
    properName: "Veteran Confirmation API",
    internalName: "confirmation",
    acl: "veteran_confirmation",
  },
];

export const apisToAcls = {
  appeals: "appeals",

  // all the ones below here could be generated...
  benefits: "vba_documents",
  confirmation: "veteran_confirmation",
  facilities: "va_facilities",
  vaForms: "va_forms",
  verification: "veteran_verification",
};

export const APIS_TO_PROPER_NAMES = {
  appeals: "Appeals Status API",

  // all the ones below here could be generated...
  benefits: "Benefits Intake API",
  claims: "Claims API",
  communityCare: "Community Care Eligibility API",
  confirmation: "Veteran Confirmation API",
  facilities: "VA Facilities API",
  health: "Health API",
  vaForms: "VA Form API",
  verification: "Veteran Verification API",
};

export const API_LIST: string[] = apiEndpointList.map((x) => x.internalName);

export const KONG_CONSUMER_APIS: string[] = apiEndpointList
  .filter((x) => x.oauthEndpoint === false)
  .map((x) => x.internalName);

export const OKTA_AUTHZ_ENDPOINTS = apiEndpointList
  .filter((x) => x.oauthEndpoint === true)
  .reduce((obj, item) => {
    return {
      ...obj,
      [item.internalName]: item.authzEndpoint,
    };
  }, {});

export const OKTA_CONSUMER_APIS: string[] = Object.keys(OKTA_AUTHZ_ENDPOINTS);
