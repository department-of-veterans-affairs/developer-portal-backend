import * as request from 'request-promise-native';
import { format } from 'url';
import { apisToAcls } from './config';
import { KongConfig, KongUser, Protocol } from './types';
import logger from './config/logger'

interface ConsumerRequest {
  username: string;
}

interface ACLRequest {
  group: string;
}

type KongRequest = ConsumerRequest | ACLRequest;

export class KongClient {
  public apiKey: string;
  public host: string;
  public port: number;
  public protocol: Protocol;
  public kongPath = '/api_management/consumers';

  constructor({ apiKey, host, port = 8000, protocol = 'https' }: KongConfig) {
    this.apiKey = apiKey;
    this.host = host;
    this.port = port;
    this.protocol = protocol;
  }

  public async createConsumer(user: KongUser) {
    try {
      const kongUser = await request.get(this.requestOptions(`${this.kongPath}/${user.consumerName()}`));
      if (kongUser) {
        return kongUser;
      }
    } catch (err) {
      logger.debug({ message: 'no existing consumer, creating new one' });
    }
    return await request.post(this.requestOptions(this.kongPath, { username: user.consumerName() }));
  }

  public async createACLs(user: KongUser) {
    const groups = (await request.get(this.requestOptions(`${this.kongPath}/${user.consumerName()}/acls`)))
      .data.map(({ group }) => group);
    return await user.apiList
      .reduce((toBeWrittenApis: string[], api: string) => {
        const group = apisToAcls[api];
        if (group && (groups.indexOf(group) === -1)) {
          toBeWrittenApis.push(api);
        }
        return toBeWrittenApis;
      }, [])
      .reduce(async (responses, api) => {
        const group = apisToAcls[api];
        const response = await request.post(this.requestOptions(`${this.kongPath}/${user.consumerName()}/acls`, { group }));
        responses[api] = response;
        return responses;
      }, {});
  }

  public async createKeyAuth(user: KongUser) {
    return await request.post(this.requestOptions(`${this.kongPath}/${user.consumerName()}/key-auth`));
  }

  private requestOptions(path: string, body?: KongRequest): request.Options {
    const url = format({
      hostname: this.host,
      pathname: path,
      port: this.port,
      protocol: this.protocol,
    });
    const headers = {
      apiKey: this.apiKey,
    };
    if (body) {
      return { body, url, headers, json: true };
    } else {
      return { url, headers, json: true };
    }
  }
}
