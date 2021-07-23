import logger from '../config/logger';
import Sentry from '../config/Sentry';
import { MonitoredService } from '../types';
import HealthCheck from './HealthCheck';

describe('HealthCheck model', () => {
  describe('check()', () => {
    const healthyService = {
      healthCheck: () => Promise.resolve({ healthy: true, serviceName: 'healthyService' }),
    } as unknown as MonitoredService;

    const unHealthyService = {
      healthCheck: () =>
        Promise.resolve({
          err: new Error("Kong did not return the expected consumer: { message: 'Not found' }"),
          healthy: false,
          serviceName: 'unHealthyService',
        }),
    } as unknown as MonitoredService;

    it('healthStatus remains "vibrant" if a result is healthy', async () => {
      const healthCheck = new HealthCheck([healthyService]);
      await healthCheck.check();

      expect(healthCheck.getResults().healthStatus).toEqual('vibrant');
      expect(healthCheck.getResults().failedHealthChecks).toEqual([]);
    });

    it('healthStatus is "lackluster" if one of the services result is unhealthy', async () => {
      const healthCheck = new HealthCheck([unHealthyService, healthyService]);
      await healthCheck.check();

      expect(healthCheck.getResults().healthStatus).toEqual('lackluster');
      expect(healthCheck.getResults().failedHealthChecks.length).toEqual(1);
      expect(healthCheck.getResults().failedHealthChecks[0].healthy).toEqual(false);
      expect(healthCheck.getResults().failedHealthChecks[0].serviceName).toEqual(
        'unHealthyService',
      );
    });

    it('sends result to logger if a result is unhealthy', async () => {
      logger.error = jest.fn();

      const healthCheck = new HealthCheck([unHealthyService, healthyService]);
      await healthCheck.check();

      expect(logger.error).toHaveBeenCalled();
    });

    it('sends result to Sentry if a result is unhealthy', async () => {
      Sentry.captureException = jest.fn();

      const healthCheck = new HealthCheck([unHealthyService, healthyService]);
      await healthCheck.check();

      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });
});
