import { OktaAuthMocks } from "../../models/Okta";

// Note that these response objects have been truncated for brevity
export const oktaAuthMocks: OktaAuthMocks = {
  // https://developer.okta.com/docs/reference/api/authorization-servers/#get-all-policies
  oktaAuthResponse: [
    {
      type: "OAUTH_AUTHORIZATION_POLICY",
      id: "defaultPolicyIdHere",
      status: "ACTIVE",
      name: "default",
      description: "default",
      priority: 1,
      system: false,
      conditions: {
        clients: {
          include: [
            "client_id_1",
            "client_id_2",
            "client_id_3",
            "client_id_4",
          ],
        },
      },
    },
    {
      type: "OAUTH_AUTHORIZATION_POLICY",
      id: "policyIdHere",
      status: "ACTIVE",
      name: "policy",
      description: "policy",
      priority: 2,
      system: false,
      conditions: {
        clients: {
          include: [],
        },
      },
    },
  ],

  // https://developer.okta.com/docs/reference/api/authorization-servers/#update-a-policy
  oktaAuthPolicyUpdateResponse: {
    type: "OAUTH_AUTHORIZATION_POLICY",
    id: "policyIdHere",
    status: "ACTIVE",
    name: "default",
    description: "policyDescription",
    priority: 1,
    system: false,
    conditions: {
      clients: {
        include: [
          "client_id_1",
          "client_id_2",
          "client_id_3",
          "client_id_4",
        ],
      },
    },
  },
};
