import 'jest';
import { ValidationResult } from '@hapi/joi';
import { Request, Response, NextFunction } from 'express';
import UserReportsHandler, { userReportsSchema } from './UserReportsHandler';
import SlackService from '../services/SlackService';
import UserReportsService from '../services/UserReportService';
import validateApiList from './schemaValidators/validateApiList';

describe('UserReportsHandler', () => {

  const mockSendConsumerReport = jest.fn();
  const mockGenerateCSVReport = jest.fn();
  const mockResponseJson = jest.fn();
  const mockResponseStatus = jest.fn();

  const userReportsService = {
    generateCSVReport: mockGenerateCSVReport,
  } as unknown as UserReportsService;
  const slackService = {
    sendConsumerReport: mockSendConsumerReport,
  } as unknown as SlackService;

  let stubReq: Request;
  const stubNext: NextFunction = jest.fn();
  const stubRes: Response = {
    json: mockResponseJson,
    status: mockResponseStatus,
  } as unknown as Response;

  beforeEach(() => {
    stubReq = {
      query: {
        apis: 'facilities,benefits',
      },
    } as Request;

    mockSendConsumerReport.mockReset();
    mockGenerateCSVReport.mockReset();
    mockResponseJson.mockReset();
    mockResponseStatus.mockReset();
    mockGenerateCSVReport.mockReturnValue({
      ok: true,
    });
  });

  describe('handler', () => {
    it('sends a message to slack', async () => {
      const handler = UserReportsHandler(userReportsService, slackService);
      await handler(stubReq, stubRes, stubNext);
  
      expect(mockSendConsumerReport).toHaveBeenCalled();
    });

    it('forwards errors to next function', async () => {
      const testError = new Error('test error');
      mockGenerateCSVReport.mockRejectedValue(testError);

      const handler = UserReportsHandler(userReportsService, slackService);
      await handler(stubReq, stubRes, stubNext);

      expect(stubNext).toHaveBeenCalledWith(testError);
    });

    it('Respond with 503 and error message', async () => {
      mockResponseStatus.mockReturnValue(stubRes);
      const handler = UserReportsHandler(userReportsService, null);
      await handler(stubReq, stubRes, stubNext);
      
      expect(mockResponseStatus).toHaveBeenCalledWith(503);
      expect(mockResponseJson).toHaveBeenCalledWith({ error: 'service not enabled' });
    });
  });

  describe('validation', () => {

    describe('apis', () => {

      describe('is not required', () => {
        const result: ValidationResult = userReportsSchema.validate({});
        expect(result.error).toEqual(undefined);
      });

      it('allows supported api values', () => {
        const payload = { apis: 'benefits' };
        const result: ValidationResult = userReportsSchema.validate(payload);
        expect(result.error).toEqual(undefined);
      });

      it('only allows supported api values', () => {
        const payload = { apis: 'benefits,horsises' };
        const result: ValidationResult = userReportsSchema.validate(payload);
        expect(result.error.message).toEqual('"apis" failed custom validation because invalid apis in list');
      });

      it('supports comma separated api values', () => {
        const apis = 'benefits,communityCare';
        const result = validateApiList(apis);
        expect(result).toEqual(apis);
      });
    
      it('throws error when unable to process the list', () => {
        const payload = { apis: 123 };
        const result: ValidationResult = userReportsSchema.validate(payload);
        expect(result.error.message).toEqual('"apis" failed custom validation because it was unable to process the provided data');
      });
    });
  });
});