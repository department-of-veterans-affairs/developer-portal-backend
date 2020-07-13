import 'jest';
import SignupMetricsService from './SignupMetricsService';
import DynamoService from './DynamoService';

let service: SignupMetricsService;
describe('SignupMetricsService', () => {
  const mockScan = jest.fn();
  const mockQuery = jest.fn();

  const mockDynamoService = {
    scan: mockScan,
    query: mockQuery,
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
        email: 'frodo@theshire.com',
        createdAt: '2020-06-29T14:00:00.000Z',
        apis: 'facilities'
      };

      mockScan.mockResolvedValue([signup]);
      const result = await service.getUniqueSignups({});
      expect(result).toStrictEqual([signup]);
    });

    it('only includes the first signup for each user', async () => {
      const firstSignup = {
        email: 'frodo@theshire.com',
        createdAt: '2020-06-29T14:00:00.000Z',
        apis: 'facilities'
      };

      mockScan.mockResolvedValue([
        firstSignup,
        {
          email: 'frodo@theshire.com',
          createdAt: '2020-06-29T20:00:00.000Z',
          apis: 'health'
        }
      ]);

      const result = await service.getUniqueSignups({});
      expect(result).toStrictEqual([{...firstSignup, apis: 'facilities,health'}]);
    });

    it('aggregates signups for each user in the window', async () => {
      mockScan.mockResolvedValue([
        {
          email: 'frodo@theshire.com',
          createdAt: '2020-06-29T14:00:00.000Z',
          apis: 'facilities'
        },
        {
          email: 'frodo@theshire.com',
          createdAt: '2020-06-29T20:00:00.000Z',
          apis: 'health'
        }
      ]);

      const result = await service.getUniqueSignups({});
      expect(result).toStrictEqual([
        {
          email: 'frodo@theshire.com',
          createdAt: '2020-06-29T14:00:00.000Z',
          apis: 'facilities,health'
        }
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
          email: 'frodo.baggins@theshire.com',
          createdAt: '2020-06-29T14:00:00.000Z',
          apis: 'benefits,facilities,health,verification'
        },
        {
          email: 'samwise.gamgee@theshire.com',
          createdAt: '2020-06-29T14:00:00.000Z',
          apis: 'benefits,claims,facilities,vaForms'
        },
        {
          email: 'pippin.took@theshire.com',
          createdAt: '2020-06-29T14:00:00.000Z',
          apis: 'claims,health,vaForms,verification'
        },
        {
          email: 'merry.brandybuck@theshire.com',
          createdAt: '2020-06-29T14:00:00.000Z',
          apis: 'benefits,claims,facilities,health,confirmation'
        }
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
            email: 'frodo.baggins@theshire.com',
            createdAt: '2020-06-29T14:00:00.000Z',
            apis: 'benefits,facilities,health,verification'
          }
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
          communityCare: 0,
          confirmation: 1,
          facilities: 3,
          health: 3,
          vaForms: 2,
          verification: 2
        });
      });

      it('counts new API signups', async () => {
        mockPreviousSignups.mockResolvedValueOnce([
          {
            email: 'frodo.baggins@theshire.com',
            createdAt: '2020-01-29T14:00:00.000Z',
            apis: 'claims'
          }
        ]);

        const result = await service.countSignups({});
        expect(result.total).toBe(3);
        expect(result.apiCounts).toStrictEqual({
          benefits: 3,
          claims: 3,
          communityCare: 0,
          confirmation: 1,
          facilities: 3,
          health: 3,
          vaForms: 2,
          verification: 2
        });
      });

      it('does not count repeated/old API signups', async () => {
        mockPreviousSignups.mockResolvedValueOnce([
          {
            email: 'frodo.baggins@theshire.com',
            createdAt: '2020-01-29T14:00:00.000Z',
            apis: 'benefits,facilities,health'
          }
        ]);

        const result = await service.countSignups({});
        expect(result.total).toBe(3);
        expect(result.apiCounts).toStrictEqual({
          benefits: 2,
          claims: 3,
          communityCare: 0,
          confirmation: 1,
          facilities: 2,
          health: 2,
          vaForms: 2,
          verification: 2
        });
      });
    });
  });
});