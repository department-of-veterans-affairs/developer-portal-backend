import { Request, Response } from 'express';
import versionHandler from './Version';

const mockVersionService = {
  get commitHash() {
    return 'test commit hash';
  }
};

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
    const handler = versionHandler(mockVersionService);
    handler(mockReq, mockRes, mockNext);

    expect(mockJson).toHaveBeenCalledWith({ commitHash: 'test commit hash' });
  });
});
