import e, { Request, Response } from 'express';
import healthCheckHandler from '../routes/HealthCheck';

describe('healthCheckHandler', () => {
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
    mockNext.mockClear();
    mockStatus.mockClear();
    mockJson.mockClear();
  });

  it('returns 200 if all services report back healthy', async () => {
    const handler = healthCheckHandler(undefined, undefined, undefined, undefined, undefined);
    await handler(mockReq, mockRes, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      health_check_status: 'vibrant',
    });
  });
});
