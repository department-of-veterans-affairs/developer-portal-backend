import { Request, Response } from 'express';
import versionHandler from './Version';

describe('versionHandler', () => {

  const mockJson = jest.fn();
  const mockNext = jest.fn();
  const mockReq = { body: {} } as Request;
  const mockRes: Response = {
    json: mockJson,
  } as unknown as Response;

  beforeEach(() => {
    mockNext.mockClear();
    mockJson.mockClear();
  });

  it('returns correct commit hash', () => {
    const handler = versionHandler();
    handler(mockReq, mockRes, mockNext);

    expect(mockJson).toHaveBeenCalledWith({ commitHash: 'test commit hash' });
  });
});
