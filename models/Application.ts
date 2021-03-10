import {
  ApplicationType,
  GrantTypes,
  OAuthApplication,
  OktaApplicationResponse,
  ResponseTypes,
} from '@okta/okta-sdk-nodejs';
import OktaService from '../services/OktaService';
import {
  OktaApplication,
  OktaUser,
} from '../types';
import { DevPortalError } from './DevPortalError';

const REDIRECT_URL = 'https://sandbox-api.va.gov/oauth2/redirect/';
const LOGIN_URL = 'https://sandbox-api.va.gov/oauth2/redirect/';
export const IDME_GROUP_ID = '00g1syt19eSr12rXz2p7';

export interface ApplicationSettings {
  name: string;
  redirectURIs: string[];
  applicationType?: ApplicationType;
  responseTypes?: ResponseTypes[];
  grantTypes?: GrantTypes[];
  clientURI?: string;
  logoURI?: string;
}

export default class Application implements OktaApplication {
  public owner: OktaUser;
  public settings: OAuthApplication;
  public client_id?: string;
  public client_secret?: string;
  public oktaID?: string;

  constructor(
    {
      name,
      redirectURIs,
      applicationType = 'web',
      responseTypes = ['code'],
      grantTypes = ['authorization_code', 'refresh_token'],
      ...options
    }: ApplicationSettings,
    owner: OktaUser,
  ) {
    this.owner = owner;
    this.settings = {
      name: 'oidc_client',
      label: name,
      signOnMode: 'OPENID_CONNECT',
      settings: {
        oauthClient: {
          application_type: applicationType,
          client_uri: options.clientURI,
          consent_method: 'REQUIRED',
          grant_types: grantTypes,
          initiate_login_uri: LOGIN_URL,
          logo_uri: options.logoURI,
          redirect_uris: redirectURIs.concat([REDIRECT_URL]),
          response_types: responseTypes,
        },
      },
    };
    if (applicationType === 'native') {
      this.settings.credentials = { oauthClient: { token_endpoint_auth_method: 'none' } };
    } else if (applicationType === 'web') {
      this.settings.settings.oauthClient.response_types.push('token', 'id_token');
      this.settings.settings.oauthClient.grant_types.push('implicit');
    }
  }

  public toOktaApp(): OAuthApplication {
    return this.settings;
  }

  public async createOktaApplication(client: OktaService): Promise<OktaApplicationResponse> {
    try {
      const resp = await client.createApplication(this, IDME_GROUP_ID);
      const { client_id, client_secret } = resp.credentials.oauthClient;
      this.client_id = client_id;
      this.client_secret = client_secret;
      this.oktaID = resp.id;
      return resp;
    } catch (err: unknown) {
      (err as DevPortalError).action = 'failed saving to Okta';
      throw err;
    }
  }
}
