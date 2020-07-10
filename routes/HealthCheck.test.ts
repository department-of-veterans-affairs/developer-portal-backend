import { Request, Response } from 'express';
import KongService from '../services/KongService';
import OktaService from '../services/OktaService';
import DynamoService from '../services/DynamoService';
import healthCheckHandler from '../routes/HealthCheck';

describe('healthCheckHandler', () => {
  const mockKongHealthCheck = jest.fn();
  const mockKong = { healthCheck: mockKongHealthCheck } as unknown as KongService;
  
  const mockOktaHealthCheck = jest.fn();
  const mockOkta = { healthCheck: mockOktaHealthCheck } as unknown as OktaService;

  const mockDynamoHealthCheck = jest.fn();
  const mockDynamo = { healthCheck: mockDynamoHealthCheck } as unknown as DynamoService;

  const mockJson = jest.fn();
  const mockNext = jest.fn();
  const mockReq = { body: {} } as Request;  
  const mockRes: Response = {
    json: mockJson,
  } as unknown as Response;

  beforeEach(() => {
    mockKongHealthCheck.mockClear();
    mockOktaHealthCheck.mockClear();
    mockDynamoHealthCheck.mockClear();

    mockNext.mockClear();
    mockJson.mockClear();

    mockKongHealthCheck.mockResolvedValue({ serviceName: 'Kong', healthy: true });
    mockOktaHealthCheck.mockResolvedValue({ serviceName: 'Okta', healthy: true });
    mockDynamoHealthCheck.mockResolvedValue({ serviceName: 'Dynamo', healthy: true });
  });

  describe('checks Kong', () => {
    it('calls Kong healthCheck', async () => {
      const handler = healthCheckHandler(mockKong, undefined, undefined, undefined, undefined);
      await handler(mockReq, mockRes, mockNext);

      expect(mockKongHealthCheck).toHaveBeenCalled();
    });
    
    it('returns unhealthy response if Kong fails to report back healthy', async () => {
      const err = new Error(`Kong did not return the expected consumer: { message: 'Not found' }`);
      const mockKongHealthCheckResponse = { serviceName: 'Kong', healthy: false, err: err };
      mockKongHealthCheck.mockResolvedValue(mockKongHealthCheckResponse);
      
      const handler = healthCheckHandler(mockKong, undefined, undefined, undefined, undefined);
      await handler(mockReq, mockRes, mockNext);
      
      expect(mockJson).toHaveBeenCalledWith({ healthStatus: 'lackluster', failedHealthChecks: [ mockKongHealthCheckResponse ] });
    });
  });

  describe('checks Okta', () => {
    it('calls Okta healthCheck', async () => {
      const handler = healthCheckHandler(mockKong, mockOkta, undefined, undefined, undefined);
      await handler(mockReq, mockRes, mockNext);

      expect(mockOktaHealthCheck).toHaveBeenCalled();
    });

    it('returns unhealthy response if Okta fails to report back healthy', async () => {
      const err = new Error(`Okta did not return a user: { constructor: { name: 'Orc' } }`);
      const mockOktaHealthCheckResponse = { serviceName: 'Okta', healthy: false, err: err };
      mockOktaHealthCheck.mockResolvedValue(mockOktaHealthCheckResponse);
      
      const handler = healthCheckHandler(mockKong, mockOkta, undefined, undefined, undefined);
      await handler(mockReq, mockRes, mockNext);
      
      expect(mockJson).toHaveBeenCalledWith({ healthStatus: 'lackluster', failedHealthChecks: [ mockOktaHealthCheckResponse ] });
    });
  });

  describe('checks DynamoDB', () => {
    it('calls Dynamo healthCheck', async () => {
      const handler = healthCheckHandler(mockKong, undefined, mockDynamo, undefined, undefined);
      await handler(mockReq, mockRes, mockNext);

      expect(mockDynamoHealthCheck).toHaveBeenCalled();
    });

    it('returns 503 if DynamoDB fails to report back healthy', async () => {
      const err = new Error(`DynamoDB did not return a record: Missing region in config`);
      const mockDynamoHealthCheckResponse = { serviceName: 'Dynamo', healthy: false, err: err };
      mockDynamoHealthCheck.mockResolvedValue(mockDynamoHealthCheckResponse);

      const handler = healthCheckHandler(mockKong, undefined, mockDynamo, undefined, undefined);
      await handler(mockReq, mockRes, mockNext);

      expect(mockJson).toHaveBeenCalledWith({ healthStatus: 'lackluster',failedHealthChecks: [ mockDynamoHealthCheckResponse ] });
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
    
    const handler = healthCheckHandler(mockKong, mockOkta, mockDynamo, undefined, undefined);
    await handler(mockReq, mockRes, mockNext);
    
    expect(mockJson).toHaveBeenCalledWith({ healthStatus: 'vibrant', failedHealthChecks: [] });
  });
});
