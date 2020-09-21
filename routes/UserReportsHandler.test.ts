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