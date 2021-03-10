declare module '@okta/okta-sdk-nodejs' {
  interface OktaPolicy {
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
  
  class Collection<T> {
    each: (iterator: (obj: T) => void | boolean) => Promise<void>
  }
  type OktaPolicyCollection = Collection<OktaPolicy>;
  interface OktaApplicationResponse {
    id: string;
    credentials: {
      oauthClient: {
        client_id: string;
        client_secret?: string;
      };
    };
  }

  type ApplicationName = 'oidc_client';
  type SignOnMode = 'OPENID_CONNECT';
  type GrantTypes =
  | 'implicit'
  | 'authorization_code'
  | 'refresh_token'
  | 'password'
  | 'client_credentials';
  type TokenEndpointAuthMethod =
  | 'client_secret_basic'
  | 'client_secret_post'
  | 'client_secret_jwt'
  | 'private_key_jwt'
  | 'none';
  type ResponseTypes = 'token' | 'id_token' | 'code';
  type ApplicationType = 'web' | 'native' | 'browser' | 'service';
  type ConsentMethod = 'REQUIRED' | 'TRUSTED';

  interface OAuthApplication {
    name: ApplicationName;
    label: string;
    signOnMode: SignOnMode;
    credentials?: {
      oauthClient: {
        token_endpoint_auth_method: TokenEndpointAuthMethod;
      };
    };
    settings: {
      oauthClient: {
        client_uri?: string;
        logo_uri?: string;
        redirect_uris: string[];
        post_logout_redirect_uris?: string[];
        response_types: ResponseTypes[];
        grant_types: GrantTypes[];
        application_type: ApplicationType;
        tos_uri?: string;
        policy_uri?: string;
        consent_method?: ConsentMethod;
        initiate_login_uri?: string;
      };
    };
  }
  
  class DefaultRequestExecutor {
    constructor()
  }

  class User {
    constructor();
  }

  interface ClientOptions {
    token: string;
    orgUrl: string;
    requestExecutor: DefaultRequestExecutor;
  }

  class Client {
    constructor(config: ClientOptions);
    createApplication(oAuthApplication: OAuthApplication): Promise<OktaApplicationResponse>;
    createApplicationGroupAssignment(id: string, groupId: string): Promise<void>;
    listAuthorizationServerPolicies(authServiceId: string): Promise<OktaPolicyCollection>;
    updateAuthorizationServerPolicy(
      authServiceId: string,
      policyId: string,
      policy: OktaPolicy): Promise<void>;
    getUser(user: string): Promise<User>;
  }
}
