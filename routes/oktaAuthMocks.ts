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
export function oktaAuthMocks(): OktaAuthMocks {
  const oktaAuthResponse = [
    {
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
      //   created: "2020-08-04T17:12:49.000Z",
      //   lastUpdated: "2020-08-28T18:46:38.000Z",
      //   _links: {
      //     self: {
      //       href: "https://oktaDomain.okta.com/api/v1/authorizationServers/authzServerIdHere/policies/policyIdHere",
      //       hints: {
      //         allow: [
      //           "GET",
      //           "PUT",
      //           "DELETE",
      //         ],
      //       },
      //     },
      //     rules: {
      //       href: "https://oktaDomain.okta.com/api/v1/authorizationServers/authzServerIdHere/policies/policyIdHere/rules",
      //       hints: {
      //         allow: [
      //           "GET",
      //         ],
      //       },
      //     },
      //     deactivate: {
      //       href: "https://oktaDomain.okta.com/api/v1/authorizationServers/authzServerIdHere/policies/policyIdHere/lifecycle/deactivate",
      //       hints: {
      //         allow: [
      //           "POST",
      //         ],
      //       },
      //     },
      //   },
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
      //   created: "2020-08-19T14:04:57.000Z",
      //   lastUpdated: "2020-08-19T14:51:37.000Z",
      //   _links: {
      //     self: {
      //       href: "https://oktaDomain.okta.com/api/v1/authorizationServers/authzServerIdHere/policies/policyIdHere",
      //       hints: {
      //         allow: [
      //           "GET",
      //           "PUT",
      //           "DELETE",
      //         ],
      //       },
      //     },
      //     rules: {
      //       href: "https://oktaDomain.okta.com/api/v1/authorizationServers/authzServerIdHere/policies/policyIdHere/rules",
      //       hints: {
      //         allow: [
      //           "GET",
      //         ],
      //       },
      //     },
      //     deactivate: {
      //       href: "https://oktaDomain.okta.com/api/v1/authorizationServers/authzServerIdHere/policies/policyIdHere/lifecycle/deactivate",
      //       hints: {
      //         allow: [
      //           "POST",
      //         ],
      //       },
      //     },
      //   },
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
    // created: "2020-08-04T17:12:49.000Z",
    // lastUpdated: "2020-09-09T19:09:44.000Z",
    // _links: {
    //   self: {
    //     href: "https://oktaDomain.okta.com/api/v1/authorizationServers/authzServerIdHere/policies/policyIdHere",
    //     hints: {
    //       allow: [
    //         "GET",
    //         "PUT",
    //         "DELETE",
    //       ],
    //     },
    //   },
    //   rules: {
    //     href: "https://oktaDomain.okta.com/api/v1/authorizationServers/authzServerIdHere/policies/policyIdHere/rules",
    //     hints: {
    //       allow: [
    //         "GET",
    //       ],
    //     },
    //   },
    //   deactivate: {
    //     href: "https://oktaDomain.okta.com/api/v1/authorizationServers/authzServerIdHere/policies/policyIdHere/lifecycle/deactivate",
    //     hints: {
    //       allow: [
    //         "POST",
    //       ],
    //     },
    //   },
    // },
  };
  return { oktaAuthResponse, oktaAuthPolicyUpdateResponse };
}
