import { Request, Response } from 'express';
import KongService from '../services/KongService';
import healthCheckHandler from '../routes/HealthCheck';

describe('healthCheckHandler', () => {
  const mockKongHealthCheck = jest.fn();
  const mockKong = { healthCheck: mockKongHealthCheck } as unknown as KongService;

  const mockJson = jest.fn();
  const mockNext = jest.fn();
  const mockReq = { body: {} } as Request;  
  const mockRes: Response = {
    json: mockJson,
  } as unknown as Response;

  beforeEach(() => {
    mockKongHealthCheck.mockReset();
    mockNext.mockClear();
    mockJson.mockClear();
  });

  describe('checks Kong', () => {
    it('calls Kong healthCheck', async () => {
      const handler = healthCheckHandler(mockKong, undefined, undefined, undefined, undefined);
      await handler(mockReq, mockRes, mockNext);

      expect(mockKongHealthCheck).toHaveBeenCalled();
    });
    
    it('returns 503 if kong fails to report back healthy', async () => {
      const err = new Error(`Kong did not return the expected consumer: { message: 'Not found' }`);
      const mockKongHealthCheckResponse = { serviceName: 'Kong', healthy: false, err: err };
      mockKongHealthCheck.mockResolvedValue(mockKongHealthCheckResponse);
      
      const handler = healthCheckHandler(mockKong, undefined, undefined, undefined, undefined);
      await handler(mockReq, mockRes, mockNext);
      
      expect(mockJson).toHaveBeenCalledWith({ healthStatus: 'lackluster', failedHealthChecks: [ mockKongHealthCheckResponse ] });
    });
  });
  
  it('sends error to the default error handler if an error occurs', async () => {
    const err = new Error('service does not exist');
    mockKongHealthCheck.mockRejectedValue(err);
  
    const handler = healthCheckHandler(mockKong, undefined, undefined, undefined, undefined);
    await handler(mockReq, mockRes, mockNext);
  
    expect(mockNext).toHaveBeenCalledWith(err);
  });

  it('returns 200 if all services report back healthy', async () => {
    mockKongHealthCheck.mockResolvedValue({ serviceName: 'Kong', healthy: true });
    
    const handler = healthCheckHandler(mockKong, undefined, undefined, undefined, undefined);
    await handler(mockReq, mockRes, mockNext);
    
    expect(mockJson).toHaveBeenCalledWith({ healthStatus: 'vibrant', failedHealthChecks: [] });
  });
});
