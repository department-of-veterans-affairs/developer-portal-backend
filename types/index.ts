export type Protocol = 'http' | 'https';

export interface KongConfig {
  apiKey: string;
  host: string;
  protocol?: Protocol;
  port: number;
}

export interface KongUser {
  apiList: string[];
  consumerName: () => string;
}

export interface OktaUser {
  apiList: string[];
  organization: string;
  email: string;
}

export interface GovDeliveryUser {
  token?: string;
  apiList: string[];
  email: string;
  firstName: string;
  kongUsername?: string;
  oauthApplication?: OktaApplication;
}

export type ResponseTypes = 'token' | 'id_token' | 'code';
export type SignOnMode = 'OPENID_CONNECT';
export type ApplicationName = 'oidc_client';
export type GrantTypes =
  | 'implicit'
  | 'authorization_code'
  | 'refresh_token'
  | 'password'
  | 'client_credentials';
export type ApplicationType = 'web' | 'native' | 'browser' | 'service';
export type ConsentMethod = 'REQUIRED' | 'TRUSTED';
export type TokenEndpointAuthMethod =
  | 'client_secret_basic'
  | 'client_secret_post'
  | 'client_secret_jwt'
  | 'private_key_jwt'
  | 'none';

export interface OAuthApplication {
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

export interface OktaApplication {
  owner: OktaUser;
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  toOktaApp: () => OAuthApplication;
}

export interface MonitoredService {
  healthCheck: () => Promise<ServiceHealthCheckResponse>;
}

export interface ServiceHealthCheckResponse {
  serviceName: string;
  healthy: boolean;
  err?: {
    message: string;
    stack?: string;
    action?: string;
  };
}

interface HttpOptions {
  timeout: number;
}

export interface DynamoConfig {
  httpOptions: HttpOptions;
  maxRetries: number;
  endpoint?: string | undefined;
}

export type OAuthAPI = {
  name: string;
  key: string;
  authzEndpoint: string | undefined;
};
export type KeyAuthAPI = {
  name: string;
  key: string;
  acl: string;
};
