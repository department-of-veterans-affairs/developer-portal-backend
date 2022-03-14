/*
 * The types for RequestHandler have been updated in new versions to return void
 * this type is not completely accurate, as express accepts async handlers. We need to
 * ignore this rule here so esling doesn't complain that you can't await void
 */
/* eslint-disable @typescript-eslint/await-thenable */
import { Request, Response } from 'express';
import KongService from '../services/KongService';
import OktaService from '../services/OktaService';
import DynamoService from '../services/DynamoService';
import healthCheckHandler, { govDeliveryHealthCheckHandler } from '../routes/HealthCheck';
import GovDeliveryService from '../services/GovDeliveryService';
import SlackService from '../services/SlackService';

describe('healthCheckHandler', () => {
  const mockKongHealthCheck = jest.fn();
  const mockKong = { healthCheck: mockKongHealthCheck } as unknown as KongService;

  const mockOktaHealthCheck = jest.fn();
  const mockOkta = { healthCheck: mockOktaHealthCheck } as unknown as OktaService;

  const mockDynamoHealthCheck = jest.fn();
  const mockDynamo = { healthCheck: mockDynamoHealthCheck } as unknown as DynamoService;

  const mockGovDeliveryHealthCheck = jest.fn();
  const mockGovDelivery = { healthCheck: mockGovDeliveryHealthCheck } as unknown as GovDeliveryService;

  const mockSlack = { healthCheck: () => ({ healthy: true }) } as unknown as SlackService;

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
    mockGovDeliveryHealthCheck.mockClear();

    mockNext.mockClear();
    mockJson.mockClear();

    mockKongHealthCheck.mockResolvedValue({ healthy: true, serviceName: 'Kong' });
    mockOktaHealthCheck.mockResolvedValue({ healthy: true, serviceName: 'Okta' });
    mockDynamoHealthCheck.mockResolvedValue({ healthy: true, serviceName: 'Dynamo' });
    mockGovDeliveryHealthCheck.mockResolvedValue({ healthy: true, serviceName: 'GovDelivery' });
  });

  describe('checks Kong', () => {
    it('calls Kong healthCheck', async () => {
      const handler = healthCheckHandler({
        dynamo: mockDynamo,
        kong: mockKong,
        okta: mockOkta,
        slack: mockSlack,
      });
      await handler(mockReq, mockRes, mockNext);

      expect(mockKongHealthCheck).toHaveBeenCalled();
    });

    it('returns unhealthy response if Kong fails to report back healthy', async () => {
      const err = new Error("Kong did not return the expected consumer: { message: 'Not found' }");
      const mockKongHealthCheckResponse = { err, healthy: false, serviceName: 'Kong' };
      mockKongHealthCheck.mockResolvedValue(mockKongHealthCheckResponse);

      const handler = healthCheckHandler({
        dynamo: mockDynamo,
        kong: mockKong,
        okta: mockOkta,
        slack: mockSlack,
      });
      await handler(mockReq, mockRes, mockNext);

      expect(mockJson).toHaveBeenCalledWith({
        failedHealthChecks: [mockKongHealthCheckResponse],
        healthStatus: 'lackluster',
      });
    });
  });

  describe('checks Okta', () => {
    it('calls Okta healthCheck', async () => {
      const handler = healthCheckHandler({
        dynamo: mockDynamo,
        kong: mockKong,
        okta: mockOkta,
        slack: mockSlack,
      });
      await handler(mockReq, mockRes, mockNext);

      expect(mockOktaHealthCheck).toHaveBeenCalled();
    });

    it('returns unhealthy response if Okta fails to report back healthy', async () => {
      const err = new Error("Okta did not return a user: { constructor: { name: 'Orc' } }");
      const mockOktaHealthCheckResponse = { err, healthy: false, serviceName: 'Okta' };
      mockOktaHealthCheck.mockResolvedValue(mockOktaHealthCheckResponse);

      const handler = healthCheckHandler({
        dynamo: mockDynamo,
        kong: mockKong,
        okta: mockOkta,
        slack: mockSlack,
      });
      await handler(mockReq, mockRes, mockNext);

      expect(mockJson).toHaveBeenCalledWith({
        failedHealthChecks: [mockOktaHealthCheckResponse],
        healthStatus: 'lackluster',
      });
    });
  });

  describe('checks DynamoDB', () => {
    it('calls Dynamo healthCheck', async () => {
      const handler = healthCheckHandler({
        dynamo: mockDynamo,
        kong: mockKong,
        okta: mockOkta,
        slack: mockSlack,
      });
      await handler(mockReq, mockRes, mockNext);

      expect(mockDynamoHealthCheck).toHaveBeenCalled();
    });

    it('returns 503 if DynamoDB fails to report back healthy', async () => {
      const err = new Error('DynamoDB did not return a record: Missing region in config');
      const mockDynamoHealthCheckResponse = { err, healthy: false, serviceName: 'Dynamo' };
      mockDynamoHealthCheck.mockResolvedValue(mockDynamoHealthCheckResponse);

      const handler = healthCheckHandler({
        dynamo: mockDynamo,
        kong: mockKong,
        okta: mockOkta,
        slack: mockSlack,
      });
      await handler(mockReq, mockRes, mockNext);

      expect(mockJson).toHaveBeenCalledWith({
        failedHealthChecks: [mockDynamoHealthCheckResponse],
        healthStatus: 'lackluster',
      });
    });
  });

  describe('checks GovDelivery', () => {
    it('calls GovDelivery healthCheck', async () => {
      const handler = govDeliveryHealthCheckHandler(mockGovDelivery);
      await handler(mockReq, mockRes, mockNext);

      expect(mockGovDeliveryHealthCheck).toHaveBeenCalled();
    });

    it('returns unhealthy response if GovDelivery fails to report back healthy', async () => {
      const err = new Error('GovDelivery did not return a valid response');
      const mockGDHealthCheckResponse = { err, healthy: false, serviceName: 'GovDelivery' };
      mockGovDeliveryHealthCheck.mockResolvedValue(mockGDHealthCheckResponse);

      const handler = govDeliveryHealthCheckHandler(mockGovDelivery);
      await handler(mockReq, mockRes, mockNext);

      expect(mockJson).toHaveBeenCalledWith({
        failedHealthChecks: [mockGDHealthCheckResponse],
        healthStatus: 'lackluster',
      });
    });
  });

  it('sends error to the default error handler if an error occurs', async () => {
    const err = new Error('service does not exist');
    mockKongHealthCheck.mockRejectedValue(err);

    const handler = healthCheckHandler({
      dynamo: mockDynamo,
      kong: mockKong,
      okta: mockOkta,
      slack: mockSlack,
    });
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await handler(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(err);
  });

  it('returns 200 if all services report back healthy', async () => {
    mockKongHealthCheck.mockResolvedValue({ healthy: true, serviceName: 'Kong' });

    const handler = healthCheckHandler({
      dynamo: mockDynamo,
      kong: mockKong,
      okta: mockOkta,
      slack: mockSlack,
    });
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await handler(mockReq, mockRes, mockNext);

    expect(mockJson).toHaveBeenCalledWith({ failedHealthChecks: [], healthStatus: 'vibrant' });
  });
});
