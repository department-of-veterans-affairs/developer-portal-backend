import 'jest';
import * as signups from './signups';

describe('getUniqueSignups', () => {
  let mockQuerySignups;
  beforeAll(() => {
    mockQuerySignups = jest.spyOn(signups, 'querySignups');
  });

  beforeEach(() => {
    mockQuerySignups.mockClear();
  });

  it('calls querySignups', async () => {
    mockQuerySignups.mockResolvedValue([]);
    await signups.getUniqueSignups({});
    expect(mockQuerySignups).toHaveBeenCalled();
  })

  it('returns values from querySignups()', async () => {
    const signup = {
      email: 'frodo@theshire.com',
      createdAt: '2020-06-29T14:00:00.000Z',
      apis: 'facilities',
    };

    mockQuerySignups.mockResolvedValue([signup]);
    const result = await signups.getUniqueSignups({});
    expect(result).toStrictEqual([signup]);
  });

  it('only includes the first signup for each user', async () => {
    const firstSignup = {
      email: 'frodo@theshire.com',
      createdAt: '2020-06-29T14:00:00.000Z',
      apis: 'facilities',
    };

    mockQuerySignups.mockResolvedValue([
      firstSignup,
      {
        email: 'frodo@theshire.com',
        createdAt: '2020-06-29T20:00:00.000Z',
        apis: 'health',
      },
    ]);

    const result = await signups.getUniqueSignups({});
    expect(result).toStrictEqual([firstSignup]);
  });

  it('aggregates signups for each user in the window', async () => {
    mockQuerySignups.mockResolvedValue([
      {
        email: 'frodo@theshire.com',
        createdAt: '2020-06-29T14:00:00.000Z',
        apis: 'facilities',
      },
      {
        email: 'frodo@theshire.com',
        createdAt: '2020-06-29T20:00:00.000Z',
        apis: 'health',
      },
    ]);

    const result = await signups.getUniqueSignups({});
    expect(result).toStrictEqual([
      {
        email: 'frodo@theshire.com',
        createdAt: '2020-06-29T14:00:00.000Z',
        apis: 'facilities,health',
      },
    ]);
  });
});

describe('getFirstTimeSignups', () => {
  let mockGetUniqueSignups, mockIsDuplicate;
  beforeAll(() => {
    mockGetUniqueSignups = jest.spyOn(signups, 'getUniqueSignups');
    mockIsDuplicate = jest.spyOn(signups, 'isDuplicateSignup');
  })

  beforeEach(() => {
    mockGetUniqueSignups.mockClear();
    mockIsDuplicate.mockClear();

    mockIsDuplicate.mockResolvedValue(false);
  });

  it('calls getUniqueSignups', async () => {
    await signups.getFirstTimeSignups({});
    expect(mockGetUniqueSignups).toHaveBeenCalled();
  });

  it("returns all signups from getUniqueSignups if they aren't duplicates", async () => {
    const signup = {
      email: 'frodo@theshire.com',
      createdAt: '2020-06-29T14:00:00.000Z',
      apis: 'facilities',
    };

    mockGetUniqueSignups.mockResolvedValue([signup]);
    const result = await signups.getFirstTimeSignups({});
    expect(result).toStrictEqual([signup]);
  });

  it('does not return duplicate signups', async () => {
    const firstSignup = {
      email: 'samwise.gamgee@theshire.com',
      createdAt: '2020-06-29T14:00:00.000Z',
      apis: 'facilities',
    };

    mockGetUniqueSignups.mockResolvedValue([
      {
        email: 'frodo@theshire.com',
        createdAt: '2020-06-29T14:00:00.000Z',
        apis: 'facilities',
      },
      firstSignup,
    ]);

    mockIsDuplicate.mockResolvedValueOnce(true);
    const result = await signups.getFirstTimeSignups({});
    expect(result).toStrictEqual([firstSignup]);
  });
});

describe('countSignups', () => {
  let mockFirstTimeSignups;
  beforeAll(() => {
    mockFirstTimeSignups = jest.spyOn(signups, 'getFirstTimeSignups').mockResolvedValue([
      {
        email: 'frodo.baggins@theshire.com',
        createdAt: '2020-06-29T14:00:00.000Z',
        apis: 'benefits,facilities,health,verification',
      },
      {
        email: 'samwise.gamgee@theshire.com',
        createdAt: '2020-06-29T14:00:00.000Z',
        apis: 'benefits,claims,facilities,vaForms',
      },
      {
        email: 'pippin.took@theshire.com',
        createdAt: '2020-06-29T14:00:00.000Z',
        apis: 'claims,health,vaForms,verification',
      },
      {
        email: 'merry.brandybuck@theshire.com',
        createdAt: '2020-06-29T14:00:00.000Z',
        apis: 'benefits,claims,facilities,health,confirmation',
      },
    ]);
  });

  beforeEach(() => {
    mockFirstTimeSignups.mockClear();
  });

  it('calls getFirstTimeSignups', async () => {
    await signups.countSignups({});
    expect(mockFirstTimeSignups).toHaveBeenCalled();
  });

  it('counts the total signups', async () => {
    const result = await signups.countSignups({});
    expect(result.total).toBe(4);
  });

  it('counts the signups by API', async () => {
    const result = await signups.countSignups({});
    expect(result.apiCounts).toStrictEqual({
      benefits: 3,
      claims: 3,
      communityCare: 0,
      confirmation: 1,
      facilities: 3,
      health: 3,
      vaForms: 2,
      verification: 2,
    });
  });
});
