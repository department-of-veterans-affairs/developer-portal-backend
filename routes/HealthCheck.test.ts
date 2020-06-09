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

    it('sends error to the default error handler if Kong throws an error', async () => {
      const err = new Error('failed to connect to Kong');
      mockKongHealthCheck.mockRejectedValue(err);

      const handler = healthCheckHandler(mockKong, undefined, undefined, undefined, undefined);
      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(err);
    });

    it('sends error to the default error handler if Kong fails to report back healthy', async () => {
      mockKongHealthCheck.mockResolvedValue(false);

      const handler = healthCheckHandler(mockKong, undefined, undefined, undefined, undefined);
      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new Error('Kong is lifeless'));
    });
  });

  it('returns 200 if all services report back healthy', async () => {
    mockKongHealthCheck.mockResolvedValue(true);

    const handler = healthCheckHandler(mockKong, undefined, undefined, undefined, undefined);
    await handler(mockReq, mockRes, mockNext);

    expect(mockJson).toHaveBeenCalledWith({
      health_check_status: 'vibrant',
    });
  });
});
