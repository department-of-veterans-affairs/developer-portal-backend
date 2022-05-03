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
      benefitsReferenceData: 'benefits-reference-data',
      confirmation: 'veteran_confirmation',
      decision_reviews: 'hlr',
      facilities: 'va_facilities',
      loan_guaranty: 'loan_guaranty',
      providerDirectory: 'provider_directory',
      vaForms: 'va_forms',
    });
  });

  it('APIS_TO_PROPER_NAMES', () => {
    expect(APIS_TO_PROPER_NAMES).toEqual({
      addressValidation: 'Address Validation API',
      appeals: 'Appeals Status API',
      benefits: 'Benefits Intake API',
      benefitsReferenceData: 'Benefits Reference Data API',
      claims: 'Claims API',
      clinicalHealth: 'Clinical Health API (FHIR)',
      communityCare: 'Community Care Eligibility API',
      confirmation: 'Veteran Confirmation API',
      decision_reviews: 'Decision Reviews API',
      facilities: 'VA Facilities API',
      health: 'Health API',
      lgyGuarantyRemittance: 'Guaranty Remittance API',
      loan_guaranty: 'Loan Guaranty API',
      providerDirectory: 'Provider Directory API',
      vaForms: 'VA Form API',
      verification: 'Veteran Verification API',
    });
  });

  it('KONG_CONSUMER_APIS', () => {
    expect(KONG_CONSUMER_APIS).toEqual([
      'benefits',
      'facilities',
      'vaForms',
      'confirmation',
      'benefitsReferenceData',
      'addressValidation',
      'appeals',
      'decision_reviews',
      'loan_guaranty',
      'providerDirectory',
    ]);
  });

  it('OKTA_AUTHZ_ENDPOINTS', () => {
    expect(OKTA_AUTHZ_ENDPOINTS).toEqual({
      claims: 'claims_endpoint',
      clinicalHealth: 'clinical_fhir_endpoint',
      communityCare: 'community_care_endpoint',
      health: 'health_endpoint',
      lgyGuarantyRemittance: 'loan_guaranty_endpoint',
      verification: 'verification_endpoint',
    });
  });

  it('OKTA_CONSUMER_APIS', () => {
    expect(OKTA_CONSUMER_APIS).toEqual([
      'health',
      'verification',
      'communityCare',
      'claims',
      'lgyGuarantyRemittance',
      'clinicalHealth',
    ]);
  });

  it('API_LIST', () => {
    expect(API_LIST.sort()).toEqual([
      'addressValidation',
      'appeals',
      'benefits',
      'benefitsReferenceData',
      'claims',
      'clinicalHealth',
      'communityCare',
      'confirmation',
      'decision_reviews',
      'facilities',
      'health',
      'lgyGuarantyRemittance',
      'loan_guaranty',
      'providerDirectory',
      'vaForms',
      'verification',
    ]);
  });
});
