import { Request, Response } from 'express';
import GovDeliveryService from '../services/GovDeliveryService';
import contactUsHandler, {
  ConsumerSupportRequest,
  contactSchema,
  PublishingSupportRequest,
} from './ContactUs';

describe('contactUsHandler', () => {
  const mockSendConsumerSupportEmail = jest.fn();
  const mockSendPublshingSupportEmail = jest.fn();
  const mockSendStatus = jest.fn();
  const mockGovDelivery = {
    sendConsumerSupportEmail: mockSendConsumerSupportEmail,
    sendPublishingSupportEmail: mockSendPublshingSupportEmail,
  } as unknown as GovDeliveryService;
  mockSendConsumerSupportEmail.mockResolvedValue({});

  const mockStatus = jest.fn();
  const mockJson = jest.fn();
  const mockNext = jest.fn();
  const mockRes: Response = {
    json: mockJson,
    sendStatus: mockSendStatus,
    status: mockStatus,
  } as unknown as Response;

  /*
   * The call to status needs to return the response object again for json
   * to be called properly.
   */
  mockStatus.mockReturnValue(mockRes);

  beforeEach(() => {
    mockStatus.mockClear();
    mockSendStatus.mockClear();
    mockJson.mockClear();
    mockNext.mockClear();
    mockSendConsumerSupportEmail.mockClear();
    mockSendPublshingSupportEmail.mockClear();
  });

  it('responds with a 200 when the request is okay', async () => {
    const handler = contactUsHandler(mockGovDelivery);
    const mockReq = {
      body: {
        apis: ['benefits', 'facilities'],
        description: 'Need help getting to Mt. Doom',
        email: 'samwise@thefellowship.org',
        firstName: 'Samwise',
        lastName: 'Gamgee',
        organization: 'The Fellowship of the Ring',
      },
    } as Request<Record<string, unknown>, Record<string, unknown>, ConsumerSupportRequest>;

    await handler(mockReq, mockRes, mockNext);

    expect(mockSendConsumerSupportEmail).toHaveBeenCalledWith({
      apis: ['benefits', 'facilities'],
      description: mockReq.body.description,
      firstName: mockReq.body.firstName,
      lastName: mockReq.body.lastName,
      organization: mockReq.body.organization,
      requester: mockReq.body.email,
    });

    expect(mockSendStatus).toHaveBeenCalledWith(200);
  });

  it('only sends apis in need of support', async () => {
    const handler = contactUsHandler(mockGovDelivery);
    const mockReq = {
      body: {
        apis: ['facilities', 'health'],
        description: 'Need help getting to Mt. Doom',
        email: 'samwise@thefellowship.org',
        firstName: 'Samwise',
        lastName: 'Gamgee',
        organization: 'The Fellowship of the Ring',
      },
    } as Request;

    await handler(mockReq, mockRes, mockNext);

    expect(mockSendConsumerSupportEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        apis: ['facilities', 'health'],
      }),
    );
  });

  it('gracefully handles no apis or organization being provided', async () => {
    const handler = contactUsHandler(mockGovDelivery);
    const mockReq = {
      body: {
        description: 'Need help getting to Mt. Doom',
        email: 'samwise@thefellowship.org',
        firstName: 'Samwise',
        lastName: 'Gamgee',
      },
    } as Request<Record<string, unknown>, Record<string, unknown>, ConsumerSupportRequest>;

    await handler(mockReq, mockRes, mockNext);

    expect(mockSendConsumerSupportEmail).toHaveBeenCalledWith({
      description: mockReq.body.description,
      firstName: mockReq.body.firstName,
      lastName: mockReq.body.lastName,
      requester: mockReq.body.email,
    });
  });

  describe('support request is for publishing', () => {
    it('responds with a 200 when the request is okay', async () => {
      const handler = contactUsHandler(mockGovDelivery);
      const mockReq = {
        body: {
          apiDescription: 'Ring',
          apiDetails: "I can't carry it for you, but I can carry you.",
          apiInternalOnly: false,
          apiOtherInfo: 'bad guys go away',
          email: 'samwise@thefellowship.org',
          firstName: 'Samwise',
          lastName: 'Gamgee',
          organization: 'The Fellowship of the Ring',
          type: 'PUBLISHING',
        },
      } as Request<Record<string, unknown>, Record<string, unknown>, PublishingSupportRequest>;

      await handler(mockReq, mockRes, mockNext);

      expect(mockSendPublshingSupportEmail).toHaveBeenCalledWith({
        apiDescription: mockReq.body.apiDescription,
        apiDetails: mockReq.body.apiDetails,
        apiInternalOnly: mockReq.body.apiInternalOnly,
        apiOtherInfo: mockReq.body.apiOtherInfo,
        firstName: mockReq.body.firstName,
        lastName: mockReq.body.lastName,
        organization: mockReq.body.organization,
        requester: mockReq.body.email,
      });

      expect(mockSendStatus).toHaveBeenCalledWith(200);
    });
  });
});

describe('validations', () => {
  const basePayload = {
    description: 'Need help getting to Mt. Doom',
    email: 'samwise@thefellowship.org',
    firstName: 'Samwise',
    lastName: 'Gamgee',
  };

  describe('firstName', () => {
    it('is required', () => {
      const payload = { ...basePayload, firstName: undefined };

      const result = contactSchema.validate(payload);

      expect(result.error?.message).toEqual('"firstName" is required');
    });

    it('is a string', () => {
      const payload = { ...basePayload, firstName: 1234 };

      const result = contactSchema.validate(payload);

      expect(result.error?.message).toEqual('"firstName" must be a string');
    });
  });

  describe('lastName', () => {
    it('is required', () => {
      const payload = { ...basePayload, lastName: undefined };

      const result = contactSchema.validate(payload);

      expect(result.error?.message).toEqual('"lastName" is required');
    });

    it('is a string', () => {
      const payload = { ...basePayload, lastName: { name: 'Gamegee' } };

      const result = contactSchema.validate(payload);

      expect(result.error?.message).toEqual('"lastName" must be a string');
    });
  });

  describe('email', () => {
    it('is required', () => {
      const payload = { ...basePayload, email: undefined };

      const result = contactSchema.validate(payload);

      expect(result.error?.message).toEqual('"email" is required');
    });

    it('is in a valid format', () => {
      const payload = { ...basePayload, email: 'http://theyaretakingthehobbitstoisengard.com' };

      const result = contactSchema.validate(payload);

      expect(result.error?.message).toEqual('"email" must be a valid email');
    });
  });

  describe('organization', () => {
    it('is a string', () => {
      const payload = { ...basePayload, organization: ['The', 'Fellowship'] };

      const result = contactSchema.validate(payload);

      expect(result.error?.message).toEqual('"organization" must be a string');
    });

    it('is allowed to be empty', () => {
      const payload = { ...basePayload, organization: '' };

      const result = contactSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });

    it('accepts other strings', () => {
      const payload = { ...basePayload, organization: 'The Fellowship' };

      const result = contactSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  describe('description', () => {
    it('is required', () => {
      const payload = { ...basePayload, description: undefined };

      const result = contactSchema.validate(payload);

      expect(result.error?.message).toEqual('"description" is required');
    });

    it('is a string', () => {
      const payload = {
        ...basePayload,
        description: { potatoes: 'boil em, mash em, stick em in a stew' },
      };

      const result = contactSchema.validate(payload);

      expect(result.error?.message).toEqual('"description" must be a string');
    });
  });

  describe('apis', () => {
    it('is an array', () => {
      const payload = { ...basePayload, apis: 'health,benefits,facilities' };

      const result = contactSchema.validate(payload);

      expect(result.error?.message).toEqual('"apis" must be an array');
    });

    it('is an array of strings', () => {
      const payload = { ...basePayload, apis: [1, 2] };

      const result = contactSchema.validate(payload);

      expect(result.error?.message).toEqual(
        '"apis[0]" must be a string. "apis[1]" must be a string',
      );
    });

    it('allows an empty array', () => {
      const payload = { ...basePayload, apis: [] };

      const result = contactSchema.validate(payload);

      expect(result.error).toBe(undefined);
    });
  });

  describe('type is publishing', () => {
    const publishingPayload = {
      ...basePayload,
      apiDetails: 'Need help getting to Mt. Doom',
      apiInternalOnly: false,
      description: undefined,
      type: 'PUBLISHING',
    };

    describe('apiDetails', () => {
      it('is required', () => {
        const payload = { ...publishingPayload, apiDetails: undefined };

        const result = contactSchema.validate(payload);

        expect(result.error?.message).toEqual('"apiDetails" is required');
      });

      it('is a string', () => {
        const payload = {
          ...publishingPayload,
          apiDetails: { potatoes: 'boil em, mash em, stick em in a stew' },
        };

        const result = contactSchema.validate(payload);

        expect(result.error?.message).toEqual('"apiDetails" must be a string');
      });
    });

    describe('apiDescription', () => {
      it('can be blank', () => {
        const payload = { ...publishingPayload, apiDescription: '' };

        const result = contactSchema.validate(payload);

        expect(result.error).toBeFalsy();
      });

      it('is a string', () => {
        const payload = {
          ...publishingPayload,
          apiDescription: { potatoes: 'boil em, mash em, stick em in a stew' },
        };

        const result = contactSchema.validate(payload);

        expect(result.error?.message).toEqual('"apiDescription" must be a string');
      });
    });

    describe('apiInternalOnly', () => {
      it('is required', () => {
        const payload = { ...publishingPayload, apiInternalOnly: undefined };

        const result = contactSchema.validate(payload);

        expect(result.error?.message).toEqual('"apiInternalOnly" is required');
      });

      it('is a boolean', () => {
        const payload = {
          ...publishingPayload,
          apiInternalOnly: { potatoes: 'boil em, mash em, stick em in a stew' },
        };

        const result = contactSchema.validate(payload);

        expect(result.error?.message).toEqual('"apiInternalOnly" must be a boolean');
      });

      describe('is true', () => {
        describe('apiInternalOnlyDetails', () => {
          it('is required', () => {
            const payload = { ...publishingPayload, apiInternalOnly: true };

            const result = contactSchema.validate(payload);

            expect(result.error?.message).toEqual('"apiInternalOnlyDetails" is required');
          });
        });
      });
    });

    describe('description', () => {
      it('is forbidden', () => {
        const payload = { ...publishingPayload, description: 'Woah how did this get here' };

        const result = contactSchema.validate(payload);

        expect(result.error?.message).toEqual('"description" is not allowed');
      });
    });
  });

  it('reports multiple failures at a time', () => {
    const payload = { ...basePayload, firstName: undefined, lastName: undefined };

    const result = contactSchema.validate(payload);

    expect(result.error?.message).toEqual('"firstName" is required. "lastName" is required');
  });
});
