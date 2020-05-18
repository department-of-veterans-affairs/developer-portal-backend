import { Request, Response } from 'express';
import contactUsHandler from './ContactUs';
import GovDeliveryService from '../services/GovDeliveryService';

const mockStatus = jest.fn();
const mockJson = jest.fn();
const mockSendEmail = jest.fn();
const mockGovDelivery = { sendEmail: mockSendEmail } as unknown as GovDeliveryService;

const mockRes: Response = {
  status: mockStatus,
  json: mockJson,
} as unknown as Response;

const mockNext = jest.fn();

describe('contactUsHandler', () => {
  beforeEach(() => {
    // It's important for the mockReturnValue to be set after the mockReset.
    // the call to status needs to return the response object again for json
    // to be called properly.
    mockStatus.mockReset();
    mockStatus.mockReturnValue(mockRes);

    mockJson.mockReset();
    mockNext.mockReset();
    mockSendEmail.mockReset();
  });

  it('returns a 400 if a single required field is missing', () => {
    const handler = contactUsHandler(mockGovDelivery);
    const mockReq = {
      body: {
        lastName: 'Gamgee',
        email: 'samwise@thefellowship.org',
        description: 'Need help getting to Mt. Doom',
      }
    } as Request;

    handler(mockReq, mockRes, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      body: `Missing Required Parameter(s): firstName`,
      statusCode: 400,
    });
  });

  it('returns a 400 if multiple required fields are missing', () => {
    const handler = contactUsHandler(mockGovDelivery);
    const mockReq = {
      body: {
        lastName: 'Gamgee',
        description: 'Need help getting to Mt. Doom',
      }
    } as Request;

    handler(mockReq, mockRes, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      body: `Missing Required Parameter(s): firstName,email`,
      statusCode: 400,
    });
  });

  it('calls to send an email', () => {
    process.env.SUPPORT_EMAIL = 'gandalf@istari.net';

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
          health: false,
          vaForms: false,
          verification: false,
        },
      }
    } as Request;

    handler(mockReq, mockRes, mockNext);

    expect(mockSendEmail).toHaveBeenCalledWith(
      mockReq.body.firstName,
      mockReq.body.lastName,
      mockReq.body.email,
      mockReq.body.organization,
      mockReq.body.apis,
      mockReq.body.description,
      'Support Needed',
      'gandalf@istari.net',
    );
    expect(mockJson).toHaveBeenCalledWith({ id: 'abc123' });
  });
});