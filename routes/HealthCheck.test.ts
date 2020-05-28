import { Request, Response } from 'express';
import KongService from '../services/KongService';
import healthCheckHandler from '../routes/HealthCheck';

describe('healthCheckHandler', () => {
  const mockKongHealthCheck = jest.fn();
  const mockKong = { healthCheck: mockKongHealthCheck } as unknown as KongService;

  const mockJson = jest.fn();
  const mockStatus = jest.fn();
  const mockNext = jest.fn();
  const mockReq = { body: {} } as Request;  
  const mockRes: Response = {
    json: mockJson,
    status: mockStatus,
  } as unknown as Response;

  // The call to status needs to return the response object again for json
  // to be called properly.
  mockStatus.mockReturnValue(mockRes);  

  beforeEach(() => {
    mockKongHealthCheck.mockReset();
    mockNext.mockClear();
    mockStatus.mockClear();
    mockJson.mockClear();
  });

  it('checks on Kong', async () => {
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

    expect(mockNext).toHaveBeenCalledWith(new Error('Kong found no users'));
  });

  it('returns 200 if all services report back healthy', async () => {
    mockKongHealthCheck.mockResolvedValue(true);

    const handler = healthCheckHandler(mockKong, undefined, undefined, undefined, undefined);
    await handler(mockReq, mockRes, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      health_check_status: 'vibrant',
    });
  });
});
