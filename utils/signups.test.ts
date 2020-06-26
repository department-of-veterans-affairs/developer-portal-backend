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
    May 2020: 16 signups, 2 users, 1 user signing up for the first time

  Tests for getUniqueSignups and countSignups use Jan 2019, July 2019, Nov 2019,
  Jan 2020, Mar 2020, and May 2020 as test data.
*/

import 'jest';
import { config } from 'aws-sdk';
import { AttributeMap } from 'aws-sdk/clients/dynamodb';
import moment from 'moment';
import { querySignups, countSignups, getUniqueSignups } from './signups';

const compareItemsByCreatedDate = (item1: AttributeMap, item2: AttributeMap): number => {
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
  let originalTable: string;
  beforeAll(() => {
    originalTable = process.env.DYNAMODB_TABLE;
    process.env.DYNAMODB_TABLE = 'dvp-dev-developer-portal-users';
    config.update({
      region: 'us-gov-west-1',
    });
  });

  afterAll(() => {
    process.env.DYNAMODB_TABLE = originalTable;
  });

  describe('querySignups', () => {
    it('gets all signup items with no options specified', async () => {
      const signups = await querySignups();
      expect(signups.length).toBeGreaterThanOrEqual(272); // signup count as of 6/24/20
  
      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'ed@adhocteam.us',
        createdAt: '2018-09-19T18:57:37.052Z',
        apis: 'facilities,verification',
      });
    });
  
    it('gets the signups after a specific date (June 2020 and after)', async () => {
      const signups = await querySignups({
        startDate: moment('2020-06-01'),
      });
      expect(signups.length).toBeGreaterThanOrEqual(6);
  
      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'ryan.travitz@adhocteam.us',
        createdAt: '2020-06-01T22:50:36.448Z',
        apis: 'facilities',
      });
    });
  
    it('gets the signups before a specific date (September 2018)', async () => {
      const signups = await querySignups({
        endDate: moment('2018-10-01').startOf('month'),
      });
      expect(signups.length).toBe(28);
  
      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'ed@adhocteam.us',
        createdAt: '2018-09-19T18:57:37.052Z',
        apis: 'facilities,verification',
      });
      expect(signups[signups.length - 1]).toEqual({
        email: 'julia@adhocteam.us',
        createdAt: '2018-09-27T16:04:53.463Z',
        apis: 'benefits',
      });
    });
  
    it('gets the signups within a specific date range (May 2020)', async () => {
      const signups = await querySignups({
        startDate: moment('2020-05-01').startOf('month'),
        endDate: moment('2020-05-31').endOf('month'),
      });
      expect(signups.length).toBe(16);
  
      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'ryan.travitz@adhocteam.us',
        createdAt: '2020-05-05T14:13:42.108Z',
        apis: 'facilities',
      });
      expect(signups[signups.length - 1]).toEqual({
        email: 'mike.lumetta@adhoc.team',
        createdAt: '2020-05-29T21:23:27.536Z',
        apis: 'benefits,claims,communityCare,confirmation,facilities,health,vaForms,verification',
      });
    });
  });

  describe('getUniqueSignups', () => {
    it('gets all unique signups', async () => {
      const signups = await getUniqueSignups({});
      expect(signups.length).toBeGreaterThanOrEqual(48);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'ed@adhocteam.us',
        createdAt: '2018-09-19T18:57:37.052Z',
        apis: 'facilities,verification',
      });
    });

    // 28 total signups, 3 users
    // no users with previous duplicates because there is no start date
    it('gets unique signups before a specific date (September 2018)', async () => {
      const signups = await getUniqueSignups({
        endDate: moment('2018-09-30').endOf('month'),
      });
      expect(signups.length).toBe(3);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'ed@adhocteam.us',
        createdAt: '2018-09-19T18:57:37.052Z',
        apis: 'facilities,verification',
      });

      expect(signups[signups.length - 1]).toEqual({
        email: 'leanna@adhocteam.us',
        createdAt: '2018-09-24T14:13:39.051Z',
        apis: 'benefits,facilities,health,verification',
      });
    });

    // 6 signups, 2 users, 1 user signing up for the first time (as of 6/25/20)
    it('gets unique signups after a specific date (June 2020)', async () => {
      const signups = await getUniqueSignups({
        startDate: moment('2020-06-01').startOf('month'),
      });
      expect(signups.length).toBeGreaterThanOrEqual(1);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'ACAREY@GMAIL.COM',
        createdAt: '2020-06-24T14:25:35.585Z',
        apis: 'benefits,confirmation,facilities,vaForms',
      });
    });

    // 11 signups, 7 users, 6 users signing up for the first time
    it('gets unique signups for Jan 2019', async () => {
      const signups = await getUniqueSignups({
        startDate: moment('2019-01-01').startOf('month'),
        endDate: moment('2019-01-01').endOf('month'),
      });
      expect(signups.length).toBe(6);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'success@example.com',
        createdAt: '2019-01-09T18:34:33.689Z',
        apis: 'facilities',
      });

      expect(signups[signups.length - 1]).toEqual({
        email: 'kalil@adhocteam.us',
        createdAt: '2019-01-24T22:29:51.958Z',
        apis: 'facilities',
      });
    });

    // 14 signups, 7 users, 5 users signing up for the first time
    it('gets unique signups for Jul 2019', async () => {
      const signups = await getUniqueSignups({
        startDate: moment('2019-07-01').startOf('month'),
        endDate: moment('2019-07-01').endOf('month'),
      });
      expect(signups.length).toBe(5);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'kalilsn@adhocteam.us',
        createdAt: '2019-07-12T17:37:31.165Z',
        apis: 'claims',
      });

      expect(signups[signups.length - 1]).toEqual({
        email: 'katherine.rodriguez@oddball.io',
        createdAt: '2019-07-23T20:03:51.194Z',
        apis: 'benefits,claims,communityCare,facilities,health,verification',
      });
    });

    // Nov 2019: 17 signups, 9 users, 4 signing up for the first time
    it('gets unique signups for Nov 2019', async () => {
      const signups = await getUniqueSignups({
        startDate: moment('2019-11-01').startOf('month'),
        endDate: moment('2019-11-01').endOf('month'),
      });
      expect(signups.length).toBe(4);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'amsapisupport@veros.com',
        createdAt: '2019-11-07T21:34:17.917Z',
        apis: 'benefits',
      });

      expect(signups[signups.length - 1]).toEqual({
        email: 'arteal89@gmail.com',
        createdAt: '2019-11-25T17:15:05.546Z',
        apis: 'vaForms',
      });
    });

    // 24 signups, 7 users, 4 users signing up for the first time
    it('gets unique signups for Jan 2020', async () => {
      const signups = await getUniqueSignups({
        startDate: moment('2020-01-01').startOf('month'),
        endDate: moment('2020-01-01').endOf('month'),
      });
      expect(signups.length).toBe(4);

      signups.sort(compareItemsByCreatedDate);
      expect(signups[0]).toEqual({
        email: 'nick.fasulo@adhocteam.us',
        createdAt: '2020-01-11T21:33:56.129Z',
        apis: 'verification',
      });

      expect(signups[signups.length - 1]).toEqual({
        email: 'willhuang@adhocteam.us',
        createdAt: '2020-01-16T18:41:28.938Z',
        apis: 'confirmation',
      });
    });

    // 5 signups, 3 users, no users signing up for the first time
    it('gets unique signups for Mar 2020', async () => {
      const signups = await getUniqueSignups({
        startDate: moment('2020-03-01').startOf('month'),
        endDate: moment('2020-03-01').endOf('month'),
      });
      expect(signups.length).toBe(0);
    });

    // 16 signups, 2 unique users, 1 user signing up for the first time
    it('gets unique signups for May 2020', async () => {
      const signups = await getUniqueSignups({
        startDate: moment('2020-05-01').startOf('month'),
        endDate: moment('2020-05-31').endOf('month'),
      });

      expect(signups.length).toBe(1);
      expect(signups[0]).toEqual({
        email: 'mike.lumetta@adhoc.team',
        createdAt: '2020-05-29T19:31:41.494Z',
        apis: 'health,vaForms',
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
      claims: 0,
    };

    // 28 signups, 3 users, 3 users signing up for the first time
    it('counts the signups before a certain date (Sept 2018)', async () => {
      const result = await countSignups({
        endDate: moment('2018-09-30').endOf('month'),
      });
  
      expect(result).toEqual({
        total: 3,
        apiCounts: {
          ... zeroCounts,
          benefits: 2,
          facilities: 2,
          health: 1,
          verification: 2,
        },
      });
    });

    it('counts the signups after a certain date (June 2020)', async () => {
      const result = await countSignups({
        startDate: moment('2020-06-01').startOf('month'),
      });
  
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.apiCounts.benefits).toBeGreaterThanOrEqual(1);
      expect(result.apiCounts.confirmation).toBeGreaterThanOrEqual(1);
      expect(result.apiCounts.facilities).toBeGreaterThanOrEqual(1);
      expect(result.apiCounts.vaForms).toBeGreaterThanOrEqual(1);
    });
    
    // 11 signups, 7 users, 6 users signing up for the first time
    it('counts the signups for Jan 2019', async () => {
      const result = await countSignups({
        startDate: moment('2019-01-01').startOf('month'),
        endDate: moment('2019-01-01').endOf('month'),
      });
  
      expect(result).toEqual({
        total: 6,
        apiCounts: {
          ... zeroCounts,
          benefits: 2,
          verification: 1,
          facilities: 5,
          health: 1,
        },
      });
    });

    // 14 signups, 7 users, 5 users signing up for the first time
    it('counts the signups for Jul 2019', async () => {
      const result = await countSignups({
        startDate: moment('2019-07-01').startOf('month'),
        endDate: moment('2019-07-01').endOf('month'),
      });
  
      expect(result).toEqual({
        total: 5,
        apiCounts: {
          ... zeroCounts,
          benefits: 3,
          claims: 3,
          communityCare: 1,
          facilities: 1,
          health: 1,
          verification: 1,
        },
      });
    });

    // 17 signups, 9 users, 4 signing up for the first time
    it('counts the signups for Nov 2019', async () => {
      const result = await countSignups({
        startDate: moment('2019-11-01').startOf('month'),
        endDate: moment('2019-11-01').endOf('month'),
      });
  
      expect(result).toEqual({
        total: 4,
        apiCounts: {
          ... zeroCounts,
          benefits: 2,
          vaForms: 2,
        },
      });
    });

    // 24 signups, 7 users, 4 users signing up for the first time
    it('counts the signups for Jan 2020', async () => {
      const result = await countSignups({
        startDate: moment('2020-01-01').startOf('month'),
        endDate: moment('2020-01-01').endOf('month'),
      });
  
      expect(result).toEqual({
        total: 4,
        apiCounts: {
          ... zeroCounts,
          benefits: 1,
          claims: 1,
          facilities: 1,
          confirmation: 1,
          verification: 1,
        },
      });
    });

    // 5 signups, 3 users, no users signing up for the first time
    it('counts the signups for Mar 2020', async () => {
      const result = await countSignups({
        startDate: moment('2020-03-01').startOf('month'),
        endDate: moment('2020-03-01').endOf('month'),
      });
  
      expect(result).toEqual({
        total: 0,
        apiCounts: zeroCounts,
      });
    });
  
    // 16 signups, 2 users, 1 user signing up for the first time
    it('counts the signups for May 2020', async () => {
      const result = await countSignups({
        startDate: moment('2020-05-01').startOf('month'),
        endDate: moment('2020-05-31').endOf('month'),
      });
  
      expect(result).toEqual({
        total: 1,
        apiCounts: {
          ... zeroCounts,
          health: 1,
          vaForms: 1,
        },
      });
    });
  });
});