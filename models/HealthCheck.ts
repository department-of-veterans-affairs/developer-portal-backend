import logger from '../config/logger';
import Sentry from '../config/Sentry';
import { MonitoredService, ServiceHealthCheckResponse } from '../types';

export interface HealthCheckResults {
  healthStatus: string;
  failedHealthChecks: Array<ServiceHealthCheckResponse>;
}

export default class HealthCheck {
  private healthCheckResults: HealthCheckResults;
  private services: MonitoredService[];

  constructor(services: MonitoredService[]) {
    this.healthCheckResults = { healthStatus: 'vibrant', failedHealthChecks: [] };
    this.services = services;
  }

  public async check(): Promise<void> {
    const resultPromises: Promise<ServiceHealthCheckResponse>[] = this.services.map(service =>
      service.healthCheck(),
    );
    const results = await Promise.all(resultPromises);
    results.forEach(result => this.addResult(result));
  }

  private addResult(result: ServiceHealthCheckResponse): void {
    if (!result.healthy) {
      if (result.err) {
        result.err = {
          message: result.err.message,
          action: result.err.action,
          stack: result.err.stack,
        };
        logger.error(result.err);
        Sentry.captureException(result.err);
      }
      this.healthCheckResults.healthStatus = 'lackluster';
      this.healthCheckResults.failedHealthChecks.push(result);
    }
  }

  public getResults(): HealthCheckResults {
    return this.healthCheckResults;
  }
}
