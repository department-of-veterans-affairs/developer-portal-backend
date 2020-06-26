import request from 'request-promise-native';
import { format } from 'url';
import { apisToAcls } from '../config';
import { KongConfig, KongUser, MonitoredService, Protocol, ServiceHealthCheckResponse } from '../types';
import logger from '../config/logger';

interface ConsumerRequest {
  username: string;
}

interface ACLRequest {
  group: string;
}

type KongRequest = ConsumerRequest | ACLRequest;

export interface KongConsumerResponse {
  id: string;
  created_at: number;
  username: string;
  custom_id: string;
  tags: string[] | null;
}

export interface KongAcl {
  group: string;
  created_at: number;
  id: string;
  consumer: {
    id: string;
  };
}
export interface KongAclsResponse {
  total: number;
  data: KongAcl[];
}

export interface KongKeyResponse {
  key: string;
  created_at: number;
  consumer: {
    id: string;
  };
  id: string;
}

export default class KongService implements MonitoredService {
  public apiKey: string;
  public host: string;
  public port: number;
  public protocol: Protocol;
  public kongPath = '/internal/admin/consumers';
  private adminConsumerName = '_internal_DeveloperPortal';

  constructor({ apiKey, host, port, protocol = 'https' }: KongConfig) {
    this.apiKey = apiKey;
    this.host = host;
    this.port = port;
    this.protocol = protocol;
  }

  public async createConsumer(user: KongUser): Promise<KongConsumerResponse> {
    try {
      const kongUser: KongConsumerResponse = await request.get(this.requestOptions(`${this.kongPath}/${user.consumerName()}`));
      if (kongUser) {
        return kongUser;
      }
    } catch (err) {
      logger.debug({ message: 'no existing consumer, creating new one' });
    }
    return request.post(this.requestOptions(this.kongPath, { username: user.consumerName() }));
  }

  public async createACLs(user: KongUser): Promise<KongAclsResponse> {
    const res: KongAclsResponse = await request.get(this.requestOptions(`${this.kongPath}/${user.consumerName()}/acls`));
    const existingGroups = res.data.map(({ group }) => group);

    const groupsToAdd = user.apiList.reduce((toAdd: string[], api: string) => {
      const validGroup = apisToAcls[api];
      if (validGroup && (!existingGroups.includes(validGroup))) {
        toAdd.push(validGroup);
      }
      return toAdd;
    }, []);

    const addCalls: Promise<KongAcl>[] = groupsToAdd.map((group: string) => (
      request.post(this.requestOptions(`${this.kongPath}/${user.consumerName()}/acls`, { group }))
    ));

    const results: KongAcl[] = await Promise.all(addCalls);
    
    return {
      total: results.length,
      data: results,
    };
  }

  public createKeyAuth(user: KongUser): Promise<KongKeyResponse> {
    return request.post(this.requestOptions(`${this.kongPath}/${user.consumerName()}/key-auth`));
  }

  // Kong is considered healthy if the admin consumer is able to query itself on the connected instance
  public async healthCheck(): Promise<ServiceHealthCheckResponse> {
    try {
      const res: KongConsumerResponse = await request.get(this.requestOptions(`${this.kongPath}/${this.adminConsumerName}`));
      if (res.username !== this.adminConsumerName) {
        throw new Error(`Kong did not return the expected consumer: ${JSON.stringify(res)}`);
      }
      return {
        serviceName: 'Kong',
        healthy: true,
       };
    } catch (err) {
      err.action = 'checking health of Kong';
      return {
        serviceName: 'Kong',
        healthy: false,
        err: err
       };
    }
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
