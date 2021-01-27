import { Request, Response } from 'express';
import contactUsHandler, { contactSchema } from './ContactUs';
import GovDeliveryService from '../services/GovDeliveryService';

describe('contactUsHandler', () => {
  const mockSendDefaultSupportEmail = jest.fn();
  const mockSendPublshingSupportEmail = jest.fn();
  const mockSendStatus = jest.fn();
  const mockGovDelivery = {
    sendDefaultSupportEmail: mockSendDefaultSupportEmail,
    sendPublishingSupportEmail: mockSendPublshingSupportEmail,
  } as unknown as GovDeliveryService;
  mockSendDefaultSupportEmail.mockResolvedValue({});


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
    mockSendDefaultSupportEmail.mockClear();
    mockSendPublshingSupportEmail.mockClear();
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

    expect(mockSendDefaultSupportEmail).toHaveBeenCalledWith({
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

    expect(mockSendDefaultSupportEmail).toHaveBeenCalledWith(expect.objectContaining({
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

    expect(mockSendDefaultSupportEmail).toHaveBeenCalledWith({
      firstName: mockReq.body.firstName,
      lastName: mockReq.body.lastName,
      requester: mockReq.body.email,
      description: mockReq.body.description,
    });
  });

  describe('support request is for publishing', () => {
    it('responds with a 200 when the request is okay', async () => {
      const handler = contactUsHandler(mockGovDelivery);
      const mockReq = {
        body: {
          type: "PUBLISHING",
          firstName: 'Samwise',
          lastName: 'Gamgee',
          email: 'samwise@thefellowship.org',
          organization: 'The Fellowship of the Ring',
          apiInternalOnly: false,
          apiDetails: "I can't carry it for you, but I can carry you.",
          apiDescription: "Ring",
          apiOtherInfo: 'bad guys go away',
        },
      } as Request;
  
      await handler(mockReq, mockRes, mockNext);
  
      expect(mockSendPublshingSupportEmail).toHaveBeenCalledWith({
        firstName: mockReq.body.firstName,
        lastName: mockReq.body.lastName,
        requester: mockReq.body.email,
        description: mockReq.body.description,
        organization: mockReq.body.organization,
        apiInternalOnly: mockReq.body.apiInternalOnly,
        apiDetails: mockReq.body.apiDetails,
        apiDescription: mockReq.body.apiDescription,
        apiOtherInfo: mockReq.body.apiOtherInfo,
      });
  
      expect(mockSendStatus).toHaveBeenCalledWith(200);
    });
  });
});

describe('validations', () => {
  const basePayload = {
    firstName: 'Samwise',
    lastName: 'Gamgee',
    email: 'samwise@thefellowship.org',
    description: 'Need help getting to Mt. Doom',
  };

  describe('firstName', () => {
    it('is required', () => {
      const payload = {...basePayload, firstName: undefined};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"firstName" is required');
    });

    it('is a string', () => {
      const payload = {...basePayload, firstName: 1234};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"firstName" must be a string');
    });
  });

  describe('lastName', () => {
    it('is required', () => {
      const payload = {...basePayload, lastName: undefined};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"lastName" is required');
    });

    it('is a string', () => {
      const payload = {...basePayload, lastName: { name: 'Gamegee' }};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"lastName" must be a string');
    });
  });

  describe('email', () => {
    it('is required', () => {
      const payload = {...basePayload, email: undefined};

      const result = contactSchema.validate(payload);
      
      expect(result.error.message).toEqual('"email" is required');
    });

    it('is in a valid format', () => {
      const payload = {...basePayload, email: 'http://theyaretakingthehobbitstoisengard.com'};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"email" must be a valid email');
    });
  });

  describe('organization', () => {
    it('is a string', () => {
      const payload = {...basePayload, organization: ['The', 'Fellowship']};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"organization" must be a string');
    });

    it('is allowed to be empty', () => {
      const payload = {...basePayload, organization: ''};

      const result = contactSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });

    it('accepts other strings', () => {
      const payload = {...basePayload, organization: 'The Fellowship'};

      const result = contactSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });


  describe('description', () => {
    it('is required', () => {
      const payload = {...basePayload, description: undefined};

      const result = contactSchema.validate(payload);
      
      expect(result.error.message).toEqual('"description" is required');
    });

    it('is a string', () => {
      const payload = {...basePayload, description: { potatoes: 'boil em, mash em, stick em in a stew' }};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"description" must be a string');
    });
  });

  describe('apis', () => {
    it('is an array', () => {
      const payload = {...basePayload, apis: 'health,benefits,facilities' };

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"apis" must be an array');
    });

    it('is an array of strings', () => {
      const payload = {...basePayload, apis: [1, 2]};

      const result = contactSchema.validate(payload);

      expect(result.error.message).toEqual('"apis[0]" must be a string. "apis[1]" must be a string');
    });

    it('allows an empty array', () => {
      const payload = {...basePayload, apis: []};

      const result = contactSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });
  
  describe('type is publishing', () => {
    const publishingPayload = {
      ...basePayload,
      type: 'PUBLISHING',
      apiDetails: 'Need help getting to Mt. Doom',
      apiInternalOnly: false,
      description: undefined,
    };

    describe('apiDetails', () => {
      it('is required', () => {
        const payload = { ...publishingPayload, apiDetails: undefined };
  
        const result = contactSchema.validate(payload);
        
        expect(result.error.message).toEqual('"apiDetails" is required');
      });

      it('is a string', () => {
        const payload = { ...publishingPayload, apiDetails: { potatoes: 'boil em, mash em, stick em in a stew' } };
  
        const result = contactSchema.validate(payload);
  
        expect(result.error.message).toEqual('"apiDetails" must be a string');
      });
    });

    describe('apiInternalOnly', () => {
      it('is required', () => {
        const payload = { ...publishingPayload, apiInternalOnly: undefined };
  
        const result = contactSchema.validate(payload);
        
        expect(result.error.message).toEqual('"apiInternalOnly" is required');
      });

      it('is a boolean', () => {
        const payload = { ...publishingPayload, apiInternalOnly: { potatoes: 'boil em, mash em, stick em in a stew' } };
  
        const result = contactSchema.validate(payload);
  
        expect(result.error.message).toEqual('"apiInternalOnly" must be a boolean');
      });
    });

    describe("description", () => {
      it('is forbidden', () => {
        const payload = { ...publishingPayload, description: "Woah how did this get here" };
  
        const result = contactSchema.validate(payload);
        
        expect(result.error.message).toEqual('"description" is not allowed');
      });
    });
  });

  it('reports multiple failures at a time', () => {
    const payload = {...basePayload, firstName: undefined, lastName: undefined};

    const result = contactSchema.validate(payload);

    expect(result.error.message).toEqual('"firstName" is required. "lastName" is required');
  });
});
