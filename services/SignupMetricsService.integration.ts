/*
  Tests signups module against historical data in dvp-dev-developer-portal-users. The
  tests in this file use a selection of months with roughly the most variation and/or
  complexity in their data. Most dev environment signups are repeats, since most users
  are people within the Lighthouse program.
  
  Below are counts for all months through May 2020. See dev/signups.sh for utilities
  wrapping the aws dynamodb commands relevant for querying this data.
  
    Sept 2018: 28 signups, 3 users, 3 users signing up for the first time
    Oct 2018: 0 signups
    Nov 2018: 0 signups
    Dec 2018: 4 signups, 3 users, 1 user signing up for the first time
    Jan 2019: 11 signups, 7 users, 6 users signing up for the first time
    Feb 2019: 20 signups, 7 users, 4 users signing up for the first time
    Mar 2019: 5 signups, 5 users, 3 users signing up for the first time
    Apr 2019: 14 signups, 3 users, 1 user signing up for the first time
    May 2019: 8 signups, 6 users, 4 users signing up for the first time
    Jun 2019: 10 signups, 5 users, 3 users signing up for the first time
    Jul 2019: 14 signups, 7 users, 5 users signing up for the first time
    Aug 2019: 7 signups, 3 users, 2 users signing up for the first time
    Sept 2019: 5 signups, 2 users, 1 user signing up for the first time
    Oct 2019: 7 signups, 3 users, 2 users signing up for the first time
    Nov 2019: 17 signups, 9 users, 4 signing up for the first time
    Dec 2019: 20 signups, 4 users, 1 user signing up for the first time
    Jan 2020: 24 signups, 7 users, 4 users signing up for the first time
    Feb 2020: 13 signups, 5 users, 2 users signing up for the first time 
    Mar 2020: 5 signups, 3 users, no users signing up for the first time
    Apr 2020: 38 signups, 4 users, no users signing up for the first time
    May 2020: 16 signups, 3 users, 1 user signing up for the first time

  Tests for getUniqueSignups and countSignups use Jan 2019, July 2019, Nov 2019,
  Jan 2020, Mar 2020, and May 2020 as test data.
*/

import 'jest';
import { config } from 'aws-sdk';
import moment from 'moment';
import SignupMetricsService, { Signup } from './SignupMetricsService';

const compareItemsByCreatedDate = (item1: Signup, item2: Signup): number => {
  if (item1.createdAt < item2.createdAt) {
    return -1;
  } else if (item2.createdAt < item1.createdAt) {
    return 1;
  } else {
    return 0;
  }
};

let describeFunc = describe;
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  // skip if we're not in an MFA session
  describeFunc = describe.skip;
}

describeFunc('signups module', () => {
  let originalTable: string | undefined;
  let service: SignupMetricsService;
  beforeAll(() => {
    originalTable = process.env.DYNAMODB_TABLE;
    process.env.DYNAMODB_TABLE = 'dvp-dev-developer-portal-users';
    config.update({
      region: 'us-gov-west-1'
    });

    service = new SignupMetricsService();
  });

  afterAll(() => {
    if (originalTable) {
      process.env.DYNAMODB_TABLE = originalTable;
    }
  });

  describe('querySignups', () => {
    it('gets all signup items with no options specified', async () => {
      const signups = await service.querySignups();
      expect(signups.length).toBeGreaterThanOrEqual(272); // signup count as of 6/24/20

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'ed@adhocteam.us',
        createdAt: '2018-09-19T18:57:37.052Z',
        apis: 'facilities,verification'
      });
    });

    it('gets the signups after a specific date (June 2020 and after)', async () => {
      const signups = await service.querySignups({
        startDate: moment('2020-06-01')
      });
      expect(signups.length).toBeGreaterThanOrEqual(6);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'ryan.travitz@adhocteam.us',
        createdAt: '2020-06-01T22:50:36.448Z',
        apis: 'facilities'
      });
    });

    it('gets the signups before a specific date (September 2018)', async () => {
      const signups = await service.querySignups({
        endDate: moment('2018-10-01').startOf('month')
      });
      expect(signups.length).toBe(28);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'ed@adhocteam.us',
        createdAt: '2018-09-19T18:57:37.052Z',
        apis: 'facilities,verification'
      });
      expect(signups[signups.length - 1]).toEqual({
        email: 'julia@adhocteam.us',
        createdAt: '2018-09-27T16:04:53.463Z',
        apis: 'benefits'
      });
    });

    it('gets the signups within a specific date range (May 2020)', async () => {
      const signups = await service.querySignups({
        startDate: moment('2020-05-01').startOf('month'),
        endDate: moment('2020-05-31').endOf('month')
      });
      expect(signups.length).toBe(16);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'ryan.travitz@adhocteam.us',
        createdAt: '2020-05-05T14:13:42.108Z',
        apis: 'facilities'
      });
      expect(signups[signups.length - 1]).toEqual({
        email: 'mike.lumetta@adhoc.team',
        createdAt: '2020-05-29T21:23:27.536Z',
        apis: 'benefits,claims,communityCare,confirmation,facilities,health,vaForms,verification'
      });
    });
  });

  describe('getUniqueSignups', () => {
    // 28 signups, 3 users, 3 users signing up for the first time
    it('gets unique signups before a certain date (September 2018)', async () => {
      const signups = await service.getUniqueSignups({
        endDate: moment('2018-09-30').endOf('month')
      });
      expect(signups.length).toBe(3);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'ed@adhocteam.us',
        createdAt: '2018-09-19T18:57:37.052Z',
        apis: 'benefits,facilities,health,verification'
      });

      expect(signups[signups.length - 1]).toEqual({
        email: 'leanna@adhocteam.us',
        createdAt: '2018-09-24T14:13:39.051Z',
        apis: 'benefits,facilities,health,verification'
      });
    });

    // 6 signups, 2 users, 1 user signing up for the first time (as of 6/26/20)
    it('gets unique signups after a certain date (June 2020)', async () => {
      const signups = await service.getUniqueSignups({
        startDate: moment('2020-06-01').startOf('month')
      });
      expect(signups.length).toBeGreaterThanOrEqual(2);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'ryan.travitz@adhocteam.us',
        createdAt: '2020-06-01T22:50:36.448Z',
        apis: expect.anything()
      });

      const apis = signups[0].apis.split(',');
      ['benefits', 'claims', 'facilities'].forEach(api => {
        expect(apis.includes(api)).toBe(true);
      });
    });

    // 11 signups, 7 users, 6 users signing up for the first time
    it('gets unique signups for Jan 2019', async () => {
      const signups = await service.getUniqueSignups({
        startDate: moment('2019-01-01').startOf('month'),
        endDate: moment('2019-01-01').endOf('month')
      });
      expect(signups.length).toBe(7);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'success@example.com',
        createdAt: '2019-01-09T18:34:33.689Z',
        apis: 'facilities'
      });

      expect(signups[signups.length - 1]).toEqual({
        email: 'kalil@adhocteam.us',
        createdAt: '2019-01-24T22:29:51.958Z',
        apis: 'facilities'
      });
    });

    // 14 signups, 7 users, 5 users signing up for the first time
    it('gets unique signups for Jul 2019', async () => {
      const signups = await service.getUniqueSignups({
        startDate: moment('2019-07-01').startOf('month'),
        endDate: moment('2019-07-01').endOf('month')
      });
      expect(signups.length).toBe(7);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'kalil@adhocteam.us',
        createdAt: '2019-07-03T14:37:07.793Z',
        apis: 'benefits,health'
      });

      expect(signups[signups.length - 1]).toEqual({
        email: 'katherine.rodriguez@oddball.io',
        createdAt: '2019-07-23T20:03:51.194Z',
        apis: 'benefits,claims,communityCare,facilities,health,verification'
      });
    });

    // 17 signups, 9 users, 4 signing up for the first time
    it('gets unique signups for Nov 2019', async () => {
      const signups = await service.getUniqueSignups({
        startDate: moment('2019-11-01').startOf('month'),
        endDate: moment('2019-11-01').endOf('month')
      });
      expect(signups.length).toBe(9);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'jeff.dunn@oddball.io',
        createdAt: '2019-11-06T18:39:09.058Z',
        apis: 'benefits,facilities'
      });

      expect(signups[signups.length - 1]).toEqual({
        email: 'mike.lumetta@adhocteam.us',
        createdAt: '2019-11-26T16:29:27.983Z',
        apis: 'claims,communityCare,facilities,health,verification'
      });
    });

    // 24 signups, 7 users, 4 users signing up for the first time
    it('gets unique signups for Jan 2020', async () => {
      const signups = await service.getUniqueSignups({
        startDate: moment('2020-01-01').startOf('month'),
        endDate: moment('2020-01-01').endOf('month')
      });
      expect(signups.length).toBe(7);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'jeff.dunn@oddball.io',
        createdAt: '2020-01-11T20:43:26.992Z',
        apis: 'benefits,claims,communityCare,confirmation,facilities,health,vaForms,verification'
      });

      expect(signups[signups.length - 1]).toEqual({
        email: 'will.huang@adhocteam.us',
        createdAt: '2020-01-16T19:18:49.117Z',
        apis: 'benefits,claims,communityCare,confirmation,facilities,health,vaForms,verification'
      });
    });

    // 5 signups, 3 users, no users signing up for the first time
    it('gets unique signups for Mar 2020', async () => {
      const signups = await service.getUniqueSignups({
        startDate: moment('2020-03-01').startOf('month'),
        endDate: moment('2020-03-01').endOf('month')
      });
      expect(signups.length).toBe(3);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'test@test.test',
        createdAt: '2020-03-02T16:58:51.799Z',
        apis: 'facilities'
      });

      expect(signups[signups.length - 1]).toEqual({
        email: 'kalil@adhocteam.us',
        createdAt: '2020-03-27T16:17:10.669Z',
        apis: 'facilities'
      });
    });

    // 16 signups, 3  users, 1 user signing up for the first time
    it('gets unique signups for May 2020', async () => {
      const signups = await service.getUniqueSignups({
        startDate: moment('2020-05-01').startOf('month'),
        endDate: moment('2020-05-01').endOf('month')
      });
      expect(signups.length).toBe(3);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'ryan.travitz@adhocteam.us',
        createdAt: '2020-05-05T14:13:42.108Z',
        apis: 'facilities,health,verification'
      });

      expect(signups[signups.length - 1]).toEqual({
        email: 'mike.lumetta@adhoc.team',
        createdAt: '2020-05-29T19:31:41.494Z',
        apis: 'benefits,claims,communityCare,confirmation,facilities,health,vaForms,verification'
      });
    });
  });

  describe('getPreviousSignups', () => {
    it('returns an empty array for a first-time signup', async () => {
      const result = await service.getPreviousSignups({
        email: 'mike.lumetta@adhoc.team',
        createdAt: '2020-05-29T19:31:41.494Z',
        apis: 'health,vaForms'
      });

      expect(result).toEqual([]);
    });

    it('returns an array of earlier signups for a repeat signup', async () => {
      const result = await service.getPreviousSignups({
        email: 'ryan.travitz@adhocteam.us',
        createdAt: '2020-05-05T14:13:42.108Z',
        apis: 'facilities'
      });

      expect(result.length).toBe(26);
      result.sort(compareItemsByCreatedDate);

      expect(result[0]).toStrictEqual({
        email: 'ryan.travitz@adhocteam.us',
        createdAt: '2019-12-23T20:48:18.188Z',
        apis: 'benefits,claims,communityCare,facilities,health,vaForms,verification'
      });

      expect(result[result.length - 1]).toStrictEqual({
        email: 'ryan.travitz@adhocteam.us',
        createdAt: '2020-04-30T16:22:00.190Z',
        apis: 'facilities'
      });
    });
  });

  describe('countSignups', () => {
    const zeroCounts = {
      benefits: 0,
      facilities: 0,
      vaForms: 0,
      confirmation: 0,
      communityCare: 0,
      health: 0,
      verification: 0,
      claims: 0
    };

    // 28 signups, 3 users, 3 users signing up for the first time
    it('counts the signups before a certain date (Sept 2018)', async () => {
      const result = await service.countSignups({
        endDate: moment('2018-09-30').endOf('month')
      });

      expect(result).toEqual({
        total: 3,
        apiCounts: {
          ...zeroCounts,
          benefits: 3,
          facilities: 3,
          health: 3,
          verification: 3
        }
      });
    });

    it('counts the signups after a certain date (June 2020)', async () => {
      const result = await service.countSignups({
        startDate: moment('2020-06-01').startOf('month')
      });

      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.apiCounts.benefits).toBeGreaterThanOrEqual(1);
      expect(result.apiCounts.confirmation).toBeGreaterThanOrEqual(1);
      expect(result.apiCounts.facilities).toBeGreaterThanOrEqual(1);
      expect(result.apiCounts.vaForms).toBeGreaterThanOrEqual(1);
    });

    // 11 signups, 7 users, 6 users signing up for the first time
    it('counts the signups for Jan 2019', async () => {
      const result = await service.countSignups({
        startDate: moment('2019-01-01').startOf('month'),
        endDate: moment('2019-01-01').endOf('month')
      });

      expect(result).toEqual({
        total: 6,
        apiCounts: {
          ...zeroCounts,
          benefits: 3,
          verification: 1,
          facilities: 5,
          health: 1
        }
      });
    });

    // 14 signups, 7 users, 5 users signing up for the first time
    it('counts the signups for Jul 2019', async () => {
      const result = await service.countSignups({
        startDate: moment('2019-07-01').startOf('month'),
        endDate: moment('2019-07-01').endOf('month')
      });

      expect(result).toEqual({
        total: 5,
        apiCounts: {
          ...zeroCounts,
          benefits: 3,
          claims: 4,
          communityCare: 1,
          facilities: 1,
          health: 1,
          verification: 1
        }
      });
    });

    // 17 signups, 9 users, 4 signing up for the first time
    it('counts the signups for Nov 2019', async () => {
      const result = await service.countSignups({
        startDate: moment('2019-11-01').startOf('month'),
        endDate: moment('2019-11-01').endOf('month')
      });

      expect(result).toEqual({
        total: 4,
        apiCounts: {
          ...zeroCounts,
          benefits: 2,
          claims: 2,
          communityCare: 1,
          vaForms: 5,
          verification: 1
        }
      });
    });

    // 24 signups, 7 users, 4 users signing up for the first time
    it('counts the signups for Jan 2020', async () => {
      const result = await service.countSignups({
        startDate: moment('2020-01-01').startOf('month'),
        endDate: moment('2020-01-01').endOf('month')
      });

      expect(result).toEqual({
        total: 4,
        apiCounts: {
          ...zeroCounts,
          benefits: 4,
          claims: 2,
          communityCare: 2,
          facilities: 2,
          health: 1,
          confirmation: 4,
          vaForms: 3,
          verification: 4
        }
      });
    });

    // 5 signups, 3 users, no users signing up for the first time
    it('counts the signups for Mar 2020', async () => {
      const result = await service.countSignups({
        startDate: moment('2020-03-01').startOf('month'),
        endDate: moment('2020-03-01').endOf('month')
      });

      expect(result).toEqual({
        total: 0,
        apiCounts: {
          ...zeroCounts,
          benefits: 1,
          claims: 1
        }
      });
    });

    // 16 signups, 3 users, 1 user signing up for the first time
    it('counts the signups for May 2020', async () => {
      const result = await service.countSignups({
        startDate: moment('2020-05-01').startOf('month'),
        endDate: moment('2020-05-31').endOf('month')
      });

      expect(result).toEqual({
        total: 1,
        apiCounts: {
          benefits: 1,
          claims: 1,
          communityCare: 1,
          confirmation: 1,
          facilities: 1,
          health: 1,
          vaForms: 2,
          verification: 1
        }
      });
    });
  });
});
