import HealthCheck from './HealthCheck';
import logger from '../config/logger';
import Sentry from '../config/Sentry';

describe('HealthCheck model', () => {
  let healthCheck: HealthCheck;

  beforeEach(() => {
    healthCheck = new HealthCheck;
  });

  describe('addResult', () => {
    it('healthStatus remains "vibrant" if a result is healthy', () => {
      const mockResult = { serviceName: 'Kong', healthy: true };
      healthCheck.addResult(mockResult);

      expect(healthCheck.healthCheckResults.healthStatus).toEqual('vibrant');
    });

    it('sets healthStatus to "lackluster" if a result is unhealthy', () => {
      const err = new Error(`Kong did not return the expected consumer: { message: 'Not found' }`);
      const mockResult = { serviceName: 'Kong', healthy: false, err: err };
      healthCheck.addResult(mockResult);
      
      expect(healthCheck.healthCheckResults.healthStatus).toEqual('lackluster');
    });
    
    it('adds result to failedHealthChecks array if a result is unhealthy', () => {
      const err = new Error(`Kong did not return the expected consumer: { message: 'Not found' }`);
      const mockResult = { serviceName: 'Kong', healthy: false, err: err };
      healthCheck.addResult(mockResult);

      expect(healthCheck.healthCheckResults.failedHealthChecks).toContain(mockResult);
    });

    it('sends result to logger if a result is unhealthy', () => {
      logger.error = jest.fn();

      const err = new Error(`Kong did not return the expected consumer: { message: 'Not found' }`);
      const mockResult = { serviceName: 'Kong', healthy: false, err: err };
      healthCheck.addResult(mockResult);

      expect(logger.error).toHaveBeenCalled();
    });

    it('sends result to Sentry if a result is unhealthy', () => {
      Sentry.captureException = jest.fn();

      const err = new Error(`Kong did not return the expected consumer: { message: 'Not found' }`);
      const mockResult = { serviceName: 'Kong', healthy: false, err: err };
      healthCheck.addResult(mockResult);

      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });
});
