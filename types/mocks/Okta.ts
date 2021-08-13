import { OktaPolicy } from '@okta/okta-sdk-nodejs';

// Note that these response objects have been truncated for brevity
export const oktaAuthMocks: {
  oktaPolicyCollection: OktaPolicy[];
  oktaPolicy: OktaPolicy;
} = {
  // https://developer.okta.com/docs/reference/api/authorization-servers/#update-a-policy
  oktaPolicy: {
    conditions: {
      clients: {
        include: ['client_id_1', 'client_id_2', 'client_id_3', 'client_id_4'],
      },
    },
    description: 'policyDescription',
    id: 'policyIdHere',
    name: 'default',
    priority: 1,
    status: 'ACTIVE',
    system: false,
    type: 'OAUTH_AUTHORIZATION_POLICY',
  },

  // https://developer.okta.com/docs/reference/api/authorization-servers/#get-all-policies
  oktaPolicyCollection: [
    {
      conditions: {
        clients: {
          include: ['client_id_1', 'client_id_2', 'client_id_3', 'client_id_4'],
        },
      },
      description: 'default',
      id: 'defaultPolicyIdHere',
      name: 'default',
      priority: 1,
      status: 'ACTIVE',
      system: false,
      type: 'OAUTH_AUTHORIZATION_POLICY',
    },
    {
      conditions: {
        clients: {
          include: [],
        },
      },
      description: 'policy',
      id: 'policyIdHere',
      name: 'policy',
      priority: 2,
      status: 'ACTIVE',
      system: false,
      type: 'OAUTH_AUTHORIZATION_POLICY',
    },
  ],
};
