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
      decision_reviews: 'hlr',
      facilities: 'va_facilities',
      loan_guaranty: 'loan_guaranty',
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
      decision_reviews: 'Decision Reviews API',
      facilities: 'VA Facilities API',
      health: 'Health API',
      loan_guaranty: 'Loan Guaranty API',
      vaForms: 'VA Form API',
      verification: 'Veteran Verification API',
    });
  });

  it('KONG_CONSUMER_APIS', () => {
    expect(KONG_CONSUMER_APIS).toEqual([
      'benefits',
      'claimsAttributes',
      'facilities',
      'vaForms',
      'confirmation',
      'addressValidation',
      'appeals',
      'decision_reviews',
      'loan_guaranty',
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
      'communityCare',
      'claims',
      'clinicalHealth',
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
      'decision_reviews',
      'facilities',
      'health',
      'loan_guaranty',
      'vaForms',
      'verification',
    ]);
  });
});
