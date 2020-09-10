type OktaResponse = {
  type: string;
  id: string;
  status: string;
  name: string;
  description: string;
  priority: number;
  system: boolean;
  conditions: {
    clients: {
      include: string[];
    };
  };
}
type OktaAuthMocks = {
  oktaAuthResponse: OktaResponse[];
  oktaAuthPolicyUpdateResponse: OktaResponse;
}
// Note that these response objects have been truncated for brevity
export function oktaAuthMocks(): OktaAuthMocks {
  const oktaAuthResponse = [
    {
      type: "OAUTH_AUTHORIZATION_POLICY",
      id: "policyIdHere1",
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
      id: "policyIdHere2",
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
  ];

  const oktaAuthPolicyUpdateResponse = {
    type: "OAUTH_AUTHORIZATION_POLICY",
    id: "policyIdHere",
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
  };
  return { oktaAuthResponse, oktaAuthPolicyUpdateResponse };
}
