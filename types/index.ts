import { OAuthApplication } from '@okta/okta-sdk-nodejs';

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
  oauthApplication?: OktaApplication;
}

export interface OktaApplication {
  owner: OktaUser;
  client_id?: string;
  client_secret?: string;
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

export interface OAuthAPI {
  name: string;
  key: string;
  authzEndpoint: string | undefined;
}
export interface KeyAuthAPI {
  name: string;
  key: string;
  acl: string;
}
