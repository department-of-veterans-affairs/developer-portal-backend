import 'jest';
import SignupMetricsService from './SignupMetricsService';
import DynamoService from './DynamoService';

let service: SignupMetricsService;
describe('SignupMetricsService', () => {
  const mockScan = jest.fn();
  const mockQuery = jest.fn();

  const mockDynamoService = {
    query: mockQuery,
    scan: mockScan,
  } as unknown as DynamoService;

  describe('getUniqueSignups', () => {
    service = new SignupMetricsService(mockDynamoService);

    beforeEach(() => {
      mockScan.mockReset();
      mockQuery.mockReset();
    });

    it('calls querySignups', async () => {
      mockScan.mockResolvedValue([]);
      await service.getUniqueSignups({});
      expect(mockScan).toHaveBeenCalled();
    });

    it('returns values from querySignups()', async () => {
      const signup = {
        apis: 'facilities',
        createdAt: '2020-06-29T14:00:00.000Z',
        email: 'frodo@theshire.com',
      };

      mockScan.mockResolvedValue([signup]);
      const result = await service.getUniqueSignups({});
      expect(result).toStrictEqual([signup]);
    });

    it('only includes the first signup for each user', async () => {
      const firstSignup = {
        apis: 'facilities',
        createdAt: '2020-06-29T14:00:00.000Z',
        email: 'frodo@theshire.com',
      };

      mockScan.mockResolvedValue([
        firstSignup,
        {
          apis: 'health',
          createdAt: '2020-06-29T20:00:00.000Z',
          email: 'frodo@theshire.com',
        },
      ]);

      const result = await service.getUniqueSignups({});
      expect(result).toStrictEqual([{ ...firstSignup, apis: 'facilities,health' }]);
    });

    it('aggregates signups for each user in the window', async () => {
      mockScan.mockResolvedValue([
        {
          apis: 'facilities',
          createdAt: '2020-06-29T14:00:00.000Z',
          email: 'frodo@theshire.com',
        },
        {
          apis: 'health',
          createdAt: '2020-06-29T20:00:00.000Z',
          email: 'frodo@theshire.com',
        },
      ]);

      const result = await service.getUniqueSignups({});
      expect(result).toStrictEqual([
        {
          apis: 'facilities,health',
          createdAt: '2020-06-29T14:00:00.000Z',
          email: 'frodo@theshire.com',
        },
      ]);
    });
  });

  describe('countSignups', () => {
    let mockUniqueSignups: jest.SpyInstance;
    let mockPreviousSignups: jest.SpyInstance;
    beforeAll(() => {
      service = new SignupMetricsService(mockDynamoService);
      mockUniqueSignups = jest.spyOn(service, 'getUniqueSignups').mockResolvedValue([
        {
          apis: 'benefits,facilities,health,verification,claimsAttributes',
          createdAt: '2020-06-29T14:00:00.000Z',
          email: 'frodo.baggins@theshire.com',
        },
        {
          apis: 'benefits,claims,facilities,vaForms',
          createdAt: '2020-06-29T14:00:00.000Z',
          email: 'samwise.gamgee@theshire.com',
        },
        {
          apis: 'claims,health,vaForms,verification',
          createdAt: '2020-06-29T14:00:00.000Z',
          email: 'pippin.took@theshire.com',
        },
        {
          apis: 'benefits,claims,facilities,health,confirmation',
          createdAt: '2020-06-29T14:00:00.000Z',
          email: 'merry.brandybuck@theshire.com',
        },
      ]);

      mockPreviousSignups = jest.spyOn(service, 'getPreviousSignups').mockResolvedValue([]);
    });

    beforeEach(() => {
      mockUniqueSignups.mockClear();
      mockPreviousSignups.mockClear();
    });

    it('calls getFirstTimeSignups', async () => {
      await service.countSignups({});
      expect(mockUniqueSignups).toHaveBeenCalled();
    });

    describe('total signups', () => {
      it('counts the total signups with no previous signups', async () => {
        const result = await service.countSignups({});
        expect(result.total).toBe(4);
      });

      it('excludes consumers who have previously signed up from the total', async () => {
        mockPreviousSignups.mockResolvedValueOnce([
          {
            apis: 'benefits,facilities,health,verification',
            createdAt: '2020-06-29T14:00:00.000Z',
            email: 'frodo.baggins@theshire.com',
          },
        ]);

        const result = await service.countSignups({});
        expect(result.total).toBe(3);
      });
    });

    describe('API signups', () => {
      it('counts the signups by API with no previous signups', async () => {
        const result = await service.countSignups({});
        expect(result.apiCounts).toStrictEqual({
          benefits: 3,
          claims: 3,
          claimsAttributes: 1,
          communityCare: 0,
          confirmation: 1,
          facilities: 3,
          health: 3,
          vaForms: 2,
          verification: 2,
        });
      });

      it('counts new API signups', async () => {
        mockPreviousSignups.mockResolvedValueOnce([
          {
            apis: 'claims',
            createdAt: '2020-01-29T14:00:00.000Z',
            email: 'frodo.baggins@theshire.com',
          },
        ]);

        const result = await service.countSignups({});
        expect(result.total).toBe(3);
        expect(result.apiCounts).toStrictEqual({
          benefits: 3,
          claims: 3,
          claimsAttributes: 1,
          communityCare: 0,
          confirmation: 1,
          facilities: 3,
          health: 3,
          vaForms: 2,
          verification: 2,
        });
      });

      it('does not count repeated/old API signups', async () => {
        mockPreviousSignups.mockResolvedValueOnce([
          {
            apis: 'benefits,facilities,health',
            createdAt: '2020-01-29T14:00:00.000Z',
            email: 'frodo.baggins@theshire.com',
          },
        ]);

        const result = await service.countSignups({});
        expect(result.total).toBe(3);
        expect(result.apiCounts).toStrictEqual({
          benefits: 2,
          claims: 3,
          claimsAttributes: 1,
          communityCare: 0,
          confirmation: 1,
          facilities: 2,
          health: 2,
          vaForms: 2,
          verification: 2,
        });
      });
    });
  });
});
