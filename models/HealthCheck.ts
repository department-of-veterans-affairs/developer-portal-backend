import logger from '../config/logger';
import Sentry from '../config/Sentry';

export interface ServiceHealthCheckResponse {
  serviceName: string;
  healthy: boolean;
  err?: {
    message: string;
    stack?: string;
    action?: string;
  };
}

export interface HealthCheckResponse {
  healthStatus: string;
  failedHealthChecks: Array<ServiceHealthCheckResponse>;
}

export default class HealthCheck {
  public healthCheckResults: HealthCheckResponse

  constructor() {
    this.healthCheckResults = { healthStatus: 'vibrant', failedHealthChecks: [] };
  }

  public addResult(result: ServiceHealthCheckResponse): void {
    if (!result.healthy) {
      if (result.err) {
        result.err = { message: result.err.message, action: result.err.action, stack: result.err.stack };
        logger.error(result.err);
        Sentry.captureException(result.err);
      }
      this.healthCheckResults.healthStatus = 'lackluster';
      this.healthCheckResults.failedHealthChecks.push(result);
    }
  }

  public getResults(): HealthCheckResponse {
    return this.healthCheckResults;
  }
}
