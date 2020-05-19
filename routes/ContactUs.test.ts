import { Request, Response } from 'express';
import contactUsHandler from './ContactUs';
import GovDeliveryService from '../services/GovDeliveryService';

const mockStatus = jest.fn();
const mockJson = jest.fn();
const mockSendEmail = jest.fn();
const mockSendStatus = jest.fn();
const mockGovDelivery = { sendSupportEmail: mockSendEmail } as unknown as GovDeliveryService;

const mockRes: Response = {
  status: mockStatus,
  json: mockJson,
  sendStatus: mockSendStatus,
} as unknown as Response;

const mockNext = jest.fn();

describe('contactUsHandler', () => {
  beforeEach(() => {
    // It's important for the mockReturnValue to be set after the mockReset.
    // the call to status needs to return the response object again for json
    // to be called properly.
    mockStatus.mockReset();
    mockStatus.mockReturnValue(mockRes);
    mockSendStatus.mockReset();

    mockJson.mockReset();
    mockNext.mockReset();
    mockSendEmail.mockReset();
    mockSendEmail.mockResolvedValue({});
  });

  it('returns a 503 if the service is not configured', async () => {
    const handler = contactUsHandler(undefined);
    const mockReq = {
      body: {
        firstName: 'Samwise',
        lastName: 'Gamgee',
        email: 'samwise@thefellowship.org',
        description: 'Need help getting to Mt. Doom',
      },
    } as Request;

    await handler(mockReq, mockRes, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(503);
    expect(mockJson).toHaveBeenCalledWith({ error: 'service not enabled' });
  });

  it('returns a 400 if a single required field is missing', async () => {
    const handler = contactUsHandler(mockGovDelivery);
    const mockReq = {
      body: {
        lastName: 'Gamgee',
        email: 'samwise@thefellowship.org',
        description: 'Need help getting to Mt. Doom',
      }
    } as Request;

    await handler(mockReq, mockRes, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      body: `Missing Required Parameter(s): firstName`,
      statusCode: 400,
    });
  });

  it('returns a 400 if multiple required fields are missing', async () => {
    const handler = contactUsHandler(mockGovDelivery);
    const mockReq = {
      body: {
        lastName: 'Gamgee',
        description: 'Need help getting to Mt. Doom',
      }
    } as Request;

    await handler(mockReq, mockRes, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      body: `Missing Required Parameter(s): firstName,email`,
      statusCode: 400,
    });
  });

  it('responds with a 200 when the request is okay', async () => {
    const handler = contactUsHandler(mockGovDelivery);
    const mockReq = {
      body: {
        firstName: 'Samwise',
        lastName: 'Gamgee',
        email: 'samwise@thefellowship.org',
        organization: 'The Fellowship of the Ring',
        description: 'Need help getting to Mt. Doom',
        apis: {
          benefits: true,
          facilities: true,
        },
      }
    } as Request;

    await handler(mockReq, mockRes, mockNext);

    expect(mockSendEmail).toHaveBeenCalledWith({
      firstName: mockReq.body.firstName,
      lastName: mockReq.body.lastName,
      requester: mockReq.body.email,
      description: mockReq.body.description,
      organization: mockReq.body.organization,
      apis: ['benefits', 'facilities'],
    });

    expect(mockSendStatus).toHaveBeenCalledWith(200);
  });

  it('only sends apis in need of support', async () => {
    const handler = contactUsHandler(mockGovDelivery);
    const mockReq = {
      body: {
        firstName: 'Samwise',
        lastName: 'Gamgee',
        email: 'samwise@thefellowship.org',
        organization: 'The Fellowship of the Ring',
        description: 'Need help getting to Mt. Doom',
        apis: {
          benefits: false,
          facilities: true,
          health: true,
          vaForms: false,
          verification: false,
        },
      }
    } as Request;

    await handler(mockReq, mockRes, mockNext);

    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      apis: ['facilities', 'health'],
    }));
  });
});