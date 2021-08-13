interface ContactDetails {
  firstName: string;
  lastName: string;
  email: string;
}
export interface ProductionAccessSupportEmail {
  primaryContact: ContactDetails;
  secondaryContact: ContactDetails;
  organization: string;
  appName: string;
  appDescription: string;
  statusUpdateEmails: string[];
  valueProvided: string;
  businessModel?: string;
  policyDocuments: string[];
  phoneNumber: string;
  apis?: string;
  monitizedVeteranInformation: boolean;
  monitizationExplanation?: string;
  veteranFacing?: boolean;
  website?: string;
  signUpLink?: string[];
  supportLink?: string[];
  platforms?: string;
  veteranFacingDescription?: string;
  vasiSystemName?: string;
  productionKeyCredentialStorage: string;
  productionOrOAuthKeyCredentialStorage: string;
  storePIIOrPHI: boolean;
  piiStorageMethod?: string;
  multipleReqSafeguards?: string;
  breachManagementProcess?: string;
  vulnerabilityManagement?: string;
  exposeVeteranInformationToThirdParties?: boolean;
  thirdPartyInfoDescription?: string;
  scopesAccessRequested?: string[];
  distributingAPIKeysToCustomers?: boolean;
  namingConvention?: string;
  centralizedBackendLog?: string;
  listedOnMyHealthApplication?: boolean;
  appImageLink: string;
  patientWaitTimeImageLink: string;
  medicalDisclaimerImageLink: string;
}
