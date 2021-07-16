import { UserDynamoItem } from '../models/User';

const mergeCommaSeparatedValues = (value1: string, value2: string): string => {
  const array1 = value1.split(',');
  const array2 = value2.split(',');
  const set = new Set([...array1, ...array2]);
  return [...set].join(',');
};

/**
 * Merges user dynamo items where their emails match
 */
export const mergeUserDynamoItems = (consumer: UserDynamoItem[]): UserDynamoItem[] => {
  // Instead of using a Set to remove duplicate emails, we use a Map.
  // This gives us easy entry if we want to merge user fields. For instance,
  // we might want to merge the oauth redirect uris or use the latest tosAccepted
  // value
  const consumerMap = new Map<string, UserDynamoItem>();

  consumer.forEach(user => {
    const existingUser = consumerMap.get(user.email);
    if (existingUser) {
      // merge users
      // apis
      user.apis = mergeCommaSeparatedValues(user.apis, existingUser.apis);
      // okta app id
      const { okta_application_id } = user;
      if (okta_application_id) {
        if (existingUser.okta_application_id) {
          user.okta_application_id = mergeCommaSeparatedValues(
            okta_application_id,
            existingUser.okta_application_id,
          );
        }
      } else {
        user.okta_application_id = existingUser.okta_application_id;
      }
    }
    consumerMap.set(user.email, user);
  });

  return Array.from(consumerMap.values());
};
