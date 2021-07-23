import logger from '../config/logger';
import Sentry from '../config/Sentry';
import { MonitoredService, ServiceHealthCheckResponse } from '../types';

export interface HealthCheckResults {
  healthStatus: string;
  failedHealthChecks: ServiceHealthCheckResponse[];
}

export default class HealthCheck {
  private healthCheckResults: HealthCheckResults;

  private readonly services: MonitoredService[];

  public constructor(services: MonitoredService[]) {
    this.healthCheckResults = { failedHealthChecks: [], healthStatus: 'vibrant' };
    this.services = services;
  }

  public async check(): Promise<void> {
    const resultPromises: Array<Promise<ServiceHealthCheckResponse>> = this.services.map(service =>
      service.healthCheck(),
    );
    const results = await Promise.all(resultPromises);
    results.forEach(result => this.addResult(result));
  }

  public getResults(): HealthCheckResults {
    return this.healthCheckResults;
  }

  private addResult(result: ServiceHealthCheckResponse): void {
    if (!result.healthy) {
      if (result.err) {
        result.err = {
          action: result.err.action,
          message: result.err.message,
          stack: result.err.stack,
        };
        logger.error(result.err);
        Sentry.captureException(result.err);
      }
      this.healthCheckResults.healthStatus = 'lackluster';
      this.healthCheckResults.failedHealthChecks.push(result);
    }
  }
}
