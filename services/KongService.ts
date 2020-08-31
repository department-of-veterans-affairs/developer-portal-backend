import axios, { AxiosInstance } from 'axios';
import { apisToAcls } from '../config';
import { KongConfig, KongUser, MonitoredService, ServiceHealthCheckResponse } from '../types';
import logger from '../config/logger';

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
  public kongPath = '/internal/admin/consumers';
  private adminConsumerName = '_internal_DeveloperPortal';
  private client: AxiosInstance;

  constructor({ apiKey, host, port, protocol = 'https' }: KongConfig) {
    const config = {
      baseURL: `${protocol}://${host}:${port}`,
      headers: {
        apiKey,
      },
    };
    this.client = axios.create(config);
  }

  public getClient(): AxiosInstance {
    return this.client;
  }

  public async createConsumer(user: KongUser): Promise<KongConsumerResponse> {
    try {
      const kongUser: KongConsumerResponse = await this.getClient()
        .get(`${this.kongPath}/${user.consumerName()}`)
        .then(response => response.data);
      if (kongUser) {
        return kongUser;
      }
    } catch (err) {
      logger.debug({ message: 'no existing consumer, creating new one' });
    }
    return this.getClient()
      .post(this.kongPath, { username: user.consumerName() })
      .then(response => response.data);
  }

  public async createACLs(user: KongUser): Promise<KongAclsResponse> {
    const res: KongAclsResponse = await this.getClient()
      .get(`${this.kongPath}/${user.consumerName()}/acls`)
      .then(response => response.data);
    const existingGroups = res.data.map(({ group }) => group);

    const groupsToAdd = user.apiList.reduce((toAdd: string[], api: string) => {
      const validGroup = apisToAcls[api];
      if (validGroup && (!existingGroups.includes(validGroup))) {
        toAdd.push(validGroup);
      }
      return toAdd;
    }, []);

    const addCalls: Promise<KongAcl>[] = groupsToAdd.map((group: string) => (
      this.getClient()
        .post(`${this.kongPath}/${user.consumerName()}/acls`, { group })
        .then(response => response.data)
    ));

    const results: KongAcl[] = await Promise.all(addCalls);

    return {
      total: results.length,
      data: results,
    };
  }

  public createKeyAuth(user: KongUser): Promise<KongKeyResponse> {
    return this.getClient()
      .post(`${this.kongPath}/${user.consumerName()}/key-auth`)
      .then(response => response.data);
  }

  // Kong is considered healthy if the admin consumer is able to query itself on the connected instance
  public async healthCheck(): Promise<ServiceHealthCheckResponse> {
    try {
      const res: KongConsumerResponse = await this.getClient()
        .get(`${this.kongPath}/${this.adminConsumerName}`)
        .then(response => response.data);
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
        err: err,
      };
    }
  }
}
