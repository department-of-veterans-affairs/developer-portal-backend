import axios, { AxiosInstance } from 'axios';
import { APIS_TO_ACLS } from '../config/apis';
import { KongConfig, KongUser, MonitoredService, ServiceHealthCheckResponse } from '../types';
import logger from '../config/logger';
import { DevPortalError } from '../models/DevPortalError';

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

interface ACLResponse {
  data: Array<{ group: string }>;
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

  private readonly adminConsumerName = '_internal_DeveloperPortal';

  private readonly client: AxiosInstance;

  public constructor({ apiKey, host, port, protocol = 'https' }: KongConfig) {
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
      const consumerResponse = await this.getClient().get<KongConsumerResponse>(
        `${this.kongPath}/${user.consumerName()}`,
      );
      const kongUser: KongConsumerResponse = consumerResponse.data;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (kongUser) {
        return kongUser;
      }
    } catch (err: unknown) {
      logger.debug({ message: 'no existing consumer, creating new one' });
    }

    const response = await this.getClient().post<KongConsumerResponse>(this.kongPath, {
      username: user.consumerName(),
    });
    return response.data;
  }

  public async createACLs(user: KongUser): Promise<KongAclsResponse> {
    const res = await this.getClient()
      .get<ACLResponse>(`${this.kongPath}/${user.consumerName()}/acls`)
      .catch(() => {
        // axios throws for anything outside the 2xx response range
      });

    const existingGroups: string[] = res ? res.data.data.map(({ group }) => group) : [];

    const groupsToAdd = user.apiList.reduce((toAdd: string[], api: string) => {
      const validGroup = APIS_TO_ACLS[api];
      if (validGroup && !existingGroups.includes(validGroup)) {
        toAdd.push(validGroup);
      }
      return toAdd;
    }, []);

    const addCalls: Array<Promise<KongAcl>> = groupsToAdd.map((group: string) =>
      this.getClient()
        .post<KongAcl>(`${this.kongPath}/${user.consumerName()}/acls`, { group })
        .then(response => response.data),
    );

    const results: KongAcl[] = await Promise.all(addCalls);

    return {
      data: results,
      total: results.length,
    };
  }

  public async createKeyAuth(user: KongUser): Promise<KongKeyResponse> {
    const response = await this.getClient().post<KongKeyResponse>(
      `${this.kongPath}/${user.consumerName()}/key-auth`,
    );
    return response.data;
  }

  // Kong is considered healthy if the admin consumer is able to query itself on the connected instance
  public async healthCheck(): Promise<ServiceHealthCheckResponse> {
    try {
      const res = await this.getClient().get<KongConsumerResponse>(
        `${this.kongPath}/${this.adminConsumerName}`,
      );
      if (res.data.username !== this.adminConsumerName) {
        throw new Error(`Kong did not return the expected consumer: ${JSON.stringify(res.data)}`);
      }
      return {
        healthy: true,
        serviceName: 'Kong',
      };
    } catch (err: unknown) {
      (err as DevPortalError).action = 'checking health of Kong';
      return {
        err: err as DevPortalError,
        healthy: false,
        serviceName: 'Kong',
      };
    }
  }
}
