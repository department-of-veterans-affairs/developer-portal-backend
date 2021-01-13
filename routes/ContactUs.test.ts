import { Request, Response } from 'express';
import contactUsHandler, { contactSchema } from './ContactUs';
import GovDeliveryService from '../services/GovDeliveryService';

describe('contactUsHandler', () => {
  const mockSendEmail = jest.fn();
  const mockSendStatus = jest.fn();
  const mockGovDelivery = { sendSupportEmail: mockSendEmail } as unknown as GovDeliveryService;
  mockSendEmail.mockResolvedValue({});


  const mockStatus = jest.fn();
  const mockJson = jest.fn();
  const mockNext = jest.fn();
  const mockRes: Response = {
    status: mockStatus,
    json: mockJson,
    sendStatus: mockSendStatus,
  } as unknown as Response;
  
  // The call to status needs to return the response object again for json
  // to be called properly.
  mockStatus.mockReturnValue(mockRes);  

  beforeEach(() => {
    mockStatus.mockClear();
    mockSendStatus.mockClear();
    mockJson.mockClear();
    mockNext.mockClear();
    mockSendEmail.mockClear();
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
        apis: ['benefits', 'facilities'],
      },
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
        apis: ['facilities', 'health'],
      },
    } as Request;

    await handler(mockReq, mockRes, mockNext);

    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      apis: ['facilities', 'health'],
    }));
  });

  it('gracefully handles no apis or organization being provided', async () => {
    const handler = contactUsHandler(mockGovDelivery);
    const mockReq = {
      body: {
        firstName: 'Samwise',
        lastName: 'Gamgee',
        email: 'samwise@thefellowship.org',
        description: 'Need help getting to Mt. Doom',
      },
    } as Request;

    await handler(mockReq, mockRes, mockNext);

    expect(mockSendEmail).toHaveBeenCalledWith({
      firstName: mockReq.body.firstName,
      lastName: mockReq.body.lastName,
      requester: mockReq.body.email,
      description: mockReq.body.description,
    });
  });
});

describe('validations', () => {
  const defaultPayload = {
    firstName: 'Samwise',
    lastName: 'Gamgee',
    email: 'samwise@thefellowship.org',
    description: 'Need help getting to Mt. Doom',
  };

  describe('firstName', () => {
    it('is required', () => {
      const payload = {...defaultPayload, firstName: undefined};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"firstName" is required');
    });

    it('is a string', () => {
      const payload = {...defaultPayload, firstName: 1234};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"firstName" must be a string');
    });
  });

  describe('lastName', () => {
    it('is required', () => {
      const payload = {...defaultPayload, lastName: undefined};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"lastName" is required');
    });

    it('is a string', () => {
      const payload = {...defaultPayload, lastName: { name: 'Gamegee' }};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"lastName" must be a string');
    });
  });

  describe('email', () => {
    it('is required', () => {
      const payload = {...defaultPayload, email: undefined};

      const result = contactSchema.validate(payload);
      
      expect(result.error.message).toEqual('"email" is required');
    });

    it('is in a valid format', () => {
      const payload = {...defaultPayload, email: 'http://theyaretakingthehobbitstoisengard.com'};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"email" must be a valid email');
    });
  });

  describe('description', () => {
    it('is a string', () => {
      const payload = {...defaultPayload, description: { potatoes: 'boil em, mash em, stick em in a stew' }};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"description" must be a string');
    });
  });

  describe('organization', () => {
    it('is a string', () => {
      const payload = {...defaultPayload, organization: ['The', 'Fellowship']};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"organization" must be a string');
    });

    it('is allowed to be empty', () => {
      const payload = {...defaultPayload, organization: ''};

      const result = contactSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });

    it('accepts other strings', () => {
      const payload = {...defaultPayload, organization: 'The Fellowship'};

      const result = contactSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  describe('apis', () => {
    it('is an array', () => {
      const payload = {...defaultPayload, apis: 'health,benefits,facilities' };

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"apis" must be an array');
    });

    it('is an array of strings', () => {
      const payload = {...defaultPayload, apis: [1, 2]};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"apis[0]" must be a string. "apis[1]" must be a string');
    });

    it('allows an empty array', () => {
      const payload = {...defaultPayload, apis: []};

      const result = contactSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  it('reports multiple failures at a time', () => {
    const payload = {...defaultPayload, firstName: undefined, lastName: undefined};

    const result = contactSchema.validate(payload);

    expect(result.error.message).toEqual('"firstName" is required. "lastName" is required');
  });
});
