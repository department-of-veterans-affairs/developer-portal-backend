import 'jest';

import {
  APIS_TO_ACLS,
  APIS_TO_PROPER_NAMES,
  KONG_CONSUMER_APIS,
  OKTA_AUTHZ_ENDPOINTS,
  OKTA_CONSUMER_APIS,
  API_LIST,
} from './apis';

describe('API constants', () => {
  it('APIS_TO_ACLS', () => {
    expect(APIS_TO_ACLS).toEqual({
      addressValidation: 'internal-va:address_validation',
      appeals: 'appeals',
      benefits: 'vba_documents',
      claimsAttributes: 'claims_attributes',
      confirmation: 'veteran_confirmation',
      decisionReviews: 'appeals',
      facilities: 'va_facilities',
      loanGuaranty: 'loan_guaranty',
      vaForms: 'va_forms',
    });
  });

  it('APIS_TO_PROPER_NAMES', () => {
    expect(APIS_TO_PROPER_NAMES).toEqual({
      addressValidation: 'Address Validation API',
      appeals: 'Appeals Status API',
      benefits: 'Benefits Intake API',
      claims: 'Claims API',
      claimsAttributes: 'Claims Attributes API',
      clinicalHealth: 'Clinical Health API (FHIR)',
      communityCare: 'Community Care Eligibility API',
      confirmation: 'Veteran Confirmation API',
      decisionReviews: 'Decision Reviews API',
      facilities: 'VA Facilities API',
      health: 'Health API',
      loanGuaranty: 'Loan Guaranty API',
      vaForms: 'VA Form API',
      verification: 'Veteran Verification API',
    });
  });

  it('KONG_CONSUMER_APIS', () => {
    expect(KONG_CONSUMER_APIS).toEqual([
      'appeals',
      'benefits',
      'claimsAttributes',
      'decisionReviews',
      'facilities',
      'loanGuaranty',
      'vaForms',
      'confirmation',
      'addressValidation',
    ]);
  });

  it('OKTA_AUTHZ_ENDPOINTS', () => {
    expect(OKTA_AUTHZ_ENDPOINTS).toEqual({
      claims: 'claims_endpoint',
      clinicalHealth: 'clinical_fhir_endpoint',
      communityCare: 'community_care_endpoint',
      health: 'health_endpoint',
      verification: 'verification_endpoint',
    });
  });

  it('OKTA_CONSUMER_APIS', () => {
    expect(OKTA_CONSUMER_APIS).toEqual([
      'health',
      'verification',
      'clinicalHealth',
      'communityCare',
      'claims',
    ]);
  });

  it('API_LIST', () => {
    expect(API_LIST.sort()).toEqual([
      'addressValidation',
      'appeals',
      'benefits',
      'claims',
      'claimsAttributes',
      'clinicalHealth',
      'communityCare',
      'confirmation',
      'decisionReviews',
      'facilities',
      'health',
      'loanGuaranty',
      'vaForms',
      'verification',
    ]);
  });
});
