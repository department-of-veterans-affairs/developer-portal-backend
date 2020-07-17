import { Request, Response } from 'express';
import signupsReportHandler, { signupsReportSchema } from './SignupsReport';
import SlackService from '../../services/SlackService';
import SignupMetricsService from '../../services/SignupMetricsService';
 
describe('signupsReportHandler', () => {
  const mockSendSignupsMessage = jest.fn();
  const mockSlack = { sendSignupsMessage: mockSendSignupsMessage } as unknown as SlackService;
  mockSendSignupsMessage.mockResolvedValue('ok');

  const mockCountSignups = jest.fn();
  const mockSignups = { countSignups: mockCountSignups } as unknown as SignupMetricsService;

  const mockStatus = jest.fn();
  const mockJson = jest.fn();
  const mockSendStatus = jest.fn();

  const mockNext = jest.fn();
  const mockReq = { query: {} } as Request;
  const mockRes: Response = {
    status: mockStatus,
    json: mockJson,
    sendStatus: mockSendStatus,
  } as unknown as Response;

  // Moment relies on Date.now when calling moment(). Mocking it here
  // means that we can have a consistent date for these tests.
  const originalDate = Date.now;
  Date.now = jest.fn().mockReturnValue(new Date('2003-12-17T00:00:00.000Z'));

  afterAll(() => {
    Date.now = originalDate;
  });

  const smallResult = {
    total: 2,
    apiCounts: {
      benefits: 1,
      facilities: 0,
      vaForms: 0,
      confirmation: 0,
      health: 2,
      communityCare: 0,
      verification: 0,
      claims: 0,
    },
  };
  const largeResult = {
    total: 12,
    apiCounts: {
      benefits: 1,
      facilities: 2,
      vaForms: 3,
      confirmation: 4,
      health: 5,
      communityCare: 6,
      verification: 7,
      claims: 8,
    },
  };
  
  beforeEach(() => {
    mockStatus.mockClear();
    mockJson.mockClear();
    mockSendStatus.mockClear();
    mockNext.mockClear();
    mockStatus.mockReturnValue(mockRes);  

    mockCountSignups.mockClear();
    mockCountSignups
      .mockResolvedValueOnce(smallResult)
      .mockResolvedValueOnce(largeResult);
  });

  it('returns a 503 if the service is not configured', async () => {
    const handler = signupsReportHandler(mockSignups, undefined);

    await handler(mockReq, mockRes, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(503);
    expect(mockJson).toHaveBeenCalledWith({ error: 'service not enabled' });
  });

  it('responds with a 200 when the request is okay', async () => {
    const handler = signupsReportHandler(mockSignups, mockSlack);

    await handler(mockReq, mockRes, mockNext);

    expect(mockSendSignupsMessage).toHaveBeenCalledWith(
      'week',
      '12/17/2003',
      smallResult,
      largeResult
    );

    expect(mockSendStatus).toHaveBeenCalledWith(200);
  });

  it('sends a start date a month prior if a monthly query is requested', async () => {
    const handler = signupsReportHandler(mockSignups, mockSlack);
    const weekMockReq = { query: { span: 'month' } } as Request;

    await handler(weekMockReq, mockRes, mockNext);

    const sentStartDate = mockCountSignups.mock.calls[0][0].startDate.utc().format('MM/DD/YYYY');

    expect(sentStartDate).toEqual('11/17/2003');
  });

  it('defaults to a start date a week prior', async () => {
    const handler = signupsReportHandler(mockSignups, mockSlack);

    await handler(mockReq, mockRes, mockNext);

    const sentStartDate = mockCountSignups.mock.calls[0][0].startDate.utc().format('MM/DD/YYYY');

    expect(sentStartDate).toEqual('12/10/2003');
  });
});

describe('validations', () => {
  describe('span', () => {
    it('is either week or month', () => {
      const payload = { span: 'Gimli' };

      const result = signupsReportSchema.validate(payload);

      expect(result.error.message).toEqual('"span" must be one of [week, month]');
    });
  });
});
