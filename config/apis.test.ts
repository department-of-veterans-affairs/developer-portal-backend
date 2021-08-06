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
      benefits: 'vba_documents',
      claimsAttributes: 'claims_attributes',
      confirmation: 'veteran_confirmation',
      facilities: 'va_facilities',
      vaForms: 'va_forms',
    });
  });

  it('APIS_TO_PROPER_NAMES', () => {
    expect(APIS_TO_PROPER_NAMES).toEqual({
      addressValidation: 'Address Validation API',
      benefits: 'Benefits Intake API',
      claims: 'Claims API',
      claimsAttributes: 'Claims Attributes API',
      communityCare: 'Community Care Eligibility API',
      confirmation: 'Veteran Confirmation API',
      facilities: 'VA Facilities API',
      health: 'Health API',
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
    ]);
  });

  it('OKTA_AUTHZ_ENDPOINTS', () => {
    expect(OKTA_AUTHZ_ENDPOINTS).toEqual({
      claims: 'claims_endpoint',
      communityCare: 'community_care_endpoint',
      health: 'health_endpoint',
      verification: 'verification_endpoint',
    });
  });

  it('OKTA_CONSUMER_APIS', () => {
    expect(OKTA_CONSUMER_APIS).toEqual(['health', 'verification', 'communityCare', 'claims']);
  });

  it('API_LIST', () => {
    expect(API_LIST).toEqual([
      'benefits',
      'claimsAttributes',
      'facilities',
      'vaForms',
      'confirmation',
      'addressValidation',
      'health',
      'verification',
      'communityCare',
      'claims',
    ]);
  });
});
