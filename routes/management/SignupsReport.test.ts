import { Request, Response } from 'express';
import signupsReportHandler, { signupsReportSchema } from './SignupsReport';
import SlackService from '../../services/SlackService';
import SignupMetricsService, { SignupCountResult, SignupQueryOptions } from '../../services/SignupMetricsService';
 
describe('signupsReportHandler', () => {
  const mockSendSignupsMessage = jest.fn();
  const mockSlack = { sendSignupsMessage: mockSendSignupsMessage } as unknown as SlackService;
  mockSendSignupsMessage.mockResolvedValue('ok');

  const mockCountSignups = jest.fn<SignupCountResult, SignupQueryOptions[]>();
  const mockSignups = { countSignups: mockCountSignups } as unknown as SignupMetricsService;

  const mockStatus = jest.fn();
  const mockJson = jest.fn();
  const mockSendStatus = jest.fn();

  let mockReq;
  const mockNext = jest.fn();
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
    mockReq = { query: {} } as Request;

    mockStatus.mockClear();
    mockJson.mockClear();
    mockSendStatus.mockClear();
    mockNext.mockClear();
    mockStatus.mockReturnValue(mockRes);  

    mockCountSignups.mockClear();
    mockCountSignups
      .mockImplementationOnce(() => smallResult)
      .mockImplementationOnce(() => largeResult);
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
    const weekMockReq = { query: { span: 'month' } } as unknown as Request;

    await handler(weekMockReq, mockRes, mockNext);

    const sentStartDate = mockCountSignups.mock.calls[0][0].startDate?.utc().format('MM/DD/YYYY');

    expect(sentStartDate).toEqual('11/17/2003');
  });

  it('defaults to a start date a week prior', async () => {
    const handler = signupsReportHandler(mockSignups, mockSlack);

    await handler(mockReq, mockRes, mockNext);

    const sentStartDate = mockCountSignups.mock.calls[0][0]?.startDate?.utc().format('MM/DD/YYYY');

    expect(sentStartDate).toEqual('12/10/2003');
  });

  it('uses the "end" query param if one exists', async () => {
    const handler = signupsReportHandler(mockSignups, mockSlack);
    mockReq = { query: { end: '2002-12-18T20:03:48.799Z' } };

    await handler(mockReq, mockRes, mockNext);

    const sentEndDate = mockCountSignups.mock.calls[0][0]?.endDate?.utc().format('MM/DD/YYYY');

    expect(sentEndDate).toEqual('12/18/2002');
  });

  it('uses the "start" query param if one exists', async () => {
    const handler = signupsReportHandler(mockSignups, mockSlack);
    mockReq = { query: { start: '2001-12-19T20:03:48.799Z' } };

    await handler(mockReq, mockRes, mockNext);

    const sentStartDate = mockCountSignups.mock.calls[0][0]?.startDate?.utc().format('MM/DD/YYYY');

    expect(sentStartDate).toEqual('12/19/2001');
  });

  it('honors the query param span if only an end date is provided', async () => {
    const handler = signupsReportHandler(mockSignups, mockSlack);
    mockReq = { query: { end: '2001-12-19T20:03:48.799Z', span: 'month' } };

    await handler(mockReq, mockRes, mockNext);

    const sentStartDate = mockCountSignups.mock.calls[0][0]?.startDate?.utc().format('MM/DD/YYYY');

    expect(sentStartDate).toEqual('11/19/2001');
  });
});

describe('validations', () => {
  describe('span', () => {
    it('is either week or month', () => {
      const payload = { span: 'Gimli' };

      const result = signupsReportSchema.validate(payload);

      expect(result.error?.message).toEqual('"span" must be one of [week, month]');
    });
  });

  describe('start', () => {
    it('is an iso8601 date', () => {
      const payload = { start: 'and my axe' };

      const result = signupsReportSchema.validate(payload);

      expect(result.error?.message).toEqual('"start" must be in ISO 8601 date format');
    });
  });

  describe('end', () => {
    it('is an iso8601 date', () => {
      const payload = { end: 'dangerous over short distances' };

      const result = signupsReportSchema.validate(payload);

      expect(result.error?.message).toEqual('"end" must be in ISO 8601 date format');
    });
  });
});
