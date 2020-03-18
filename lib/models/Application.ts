import { OktaClient } from '../OktaClient';
import { GrantTypes,
         OAuthApplication,
         OktaApplication,
         OktaUser,
         ResponseTypes } from '../types';

const REDIRECT_URL = 'https://dev-api.va.gov/oauth2/redirect/';
const LOGIN_URL = 'https://dev-api.va.gov/oauth2/redirect/';
const IDME_GROUP_ID = '00g1syt19eSr12rXz2p7';

export interface ApplicationSettings {
  name: string;
  redirectURIs: string[];
  responseTypes?: ResponseTypes[];
  grantTypes?: GrantTypes[];
  clientURI?: string;
  logoURI?: string;
}

export class Application implements OktaApplication {
  public owner?: OktaUser;
  public settings: OAuthApplication;
  public errors: Error[] = [];
  public client_id?: string;
  public client_secret?: string;
  public oktaID?: string;

  constructor({
    name,
    redirectURIs,
    responseTypes = ['token', 'id_token', 'code'],
    grantTypes = ['authorization_code', 'implicit', 'refresh_token'],
    ...options
  }: ApplicationSettings, owner?: OktaUser) {
    this.owner = owner;
    this.settings = {
      name: 'oidc_client',
      label: name,
      signOnMode: 'OPENID_CONNECT',
      settings: {
        oauthClient: {
          client_uri: options.clientURI,
          logo_uri: options.logoURI,
          redirect_uris: redirectURIs.concat([REDIRECT_URL]),
          response_types: responseTypes,
          grant_types: grantTypes,
          application_type: 'web',
          consent_method: 'REQUIRED',
          initiate_login_uri: LOGIN_URL,
        },
      },
    };
  }

  public toOktaApp() {
    return this.settings;
  }

  public async createOktaApplication(client: OktaClient) {
    try {
      const resp = await client.createApplication(this, IDME_GROUP_ID);
      const { client_id, client_secret } = resp.credentials.oauthClient;
      this.client_id = client_id;
      this.client_secret = client_secret;
      this.oktaID = resp.id;
      return resp;
    } catch (error) {
      this.errors.push(error);
      throw this;
    }
  }
}
