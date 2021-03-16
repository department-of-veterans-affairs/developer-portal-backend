import { Request, Response } from 'express';
import { getBakedEnv } from '../generated/baked-env';
import versionHandler from './Version';

jest.mock('../generated/baked-env', () => ({
  getBakedEnv: jest.fn(),
}));

const mockBakedEnv = ((returnValue: string | undefined) => {
  (getBakedEnv as unknown as jest.Mock).mockImplementation(
    () => returnValue ?? 'undefined'
  );
});

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
    (getBakedEnv as unknown as jest.Mock).mockClear();
  });

  it('returns correct commit hash', () => {
    mockBakedEnv('mocked commit hash');

    const handler = versionHandler();
    handler(mockReq, mockRes, mockNext);

    expect(getBakedEnv).toHaveBeenCalledWith('NODE_APP_COMMIT_HASH');
    expect(mockJson).toHaveBeenCalledWith({ commitHash: 'mocked commit hash' });
  });

  describe('it gracefully handles undefined environment variables', () => {

    it('undefined commit hash', () => {
      mockBakedEnv(undefined);

      const handler = versionHandler();
      handler(mockReq, mockRes, mockNext);
  
      expect(getBakedEnv).toHaveBeenCalledWith('NODE_APP_COMMIT_HASH');
      expect(mockJson).toHaveBeenCalledWith({ commitHash: 'undefined' });
    });
  });
});
