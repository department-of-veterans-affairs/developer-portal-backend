import { Request, Response } from 'express';
import applyWrapupHandler from './ApplyWrapup';
import SlackService from '../../services/SlackService';

describe('applyWrapupHandler', () => {
  const mockSendWrapupMessage = jest.fn();
  const mockSlack = { sendWrapupMessage: mockSendWrapupMessage } as unknown as SlackService;
  mockSendWrapupMessage.mockResolvedValue('ok');

  const mockStatus = jest.fn();
  const mockJson = jest.fn();
  const mockSendStatus = jest.fn();

  const mockNext = jest.fn();
  const mockReq = {} as Request;
  const mockRes: Response = {
    status: mockStatus,
    json: mockJson,
    sendStatus: mockSendStatus,
  } as unknown as Response;
  
  beforeEach(() => {
    mockStatus.mockClear();
    mockJson.mockClear();
    mockSendStatus.mockClear();
    mockNext.mockClear();
    mockStatus.mockReturnValue(mockRes);  
  });
 

  it('returns a 503 if the service is not configured', async () => {
    const handler = applyWrapupHandler(undefined);

    await handler(mockReq, mockRes, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(503);
    expect(mockJson).toHaveBeenCalledWith({ error: 'service not enabled' });
  });

  it('responds with a 200 when the request is okay', async () => {
    const handler = applyWrapupHandler(mockSlack);

    await handler(mockReq, mockRes, mockNext);

    expect(mockSendWrapupMessage).toHaveBeenCalledWith({
      duration: 'week',
      numApplications: 12,
      numByApi: [
        { name: 'Facilities', num: 7 },
        { name: 'Benefits', num: 6 },
      ],
    });

    expect(mockSendStatus).toHaveBeenCalledWith(200);
  });
});
