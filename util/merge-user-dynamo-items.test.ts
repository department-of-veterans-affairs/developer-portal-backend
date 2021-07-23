import 'jest';
import { UserDynamoItem } from '../models/User';
import { mergeUserDynamoItems } from './merge-user-dynamo-items';

const mockDynamoItems: UserDynamoItem[] = [
  {
    apis: 'ab',
    createdAt: '1234567890',
    description: 'super chill',
    email: 'fbag@hobbiton.com',
    firstName: 'Frodo',
    lastName: 'Baggins',
    oAuthRedirectURI: 'http://elvish-swords.com',
    okta_application_id: 'okta-id',
    okta_client_id: 'okta-client-id',
    organization: 'The Fellowship',
    tosAccepted: true,
  },
  {
    apis: 'va,xz,dx',
    createdAt: '1234567890',
    description: 'super cool',
    email: 'wizz@higherbeings.com',
    firstName: 'Gandalf',
    lastName: 'Gray',
    oAuthRedirectURI: 'http://wanna-use-magic.com',
    organization: 'The Fellowship',
    tosAccepted: true,
  },
  {
    apis: 'xy,dx',
    createdAt: '1234567890',
    description: 'super chill',
    email: 'fbag@hobbiton.com',
    firstName: 'Frodo',
    lastName: 'Baggins',
    oAuthRedirectURI: 'http://elvish-swords.com',
    okta_application_id: 'another-okta-id',
    okta_client_id: 'okta-client-id',
    organization: 'The Fellowship',
    tosAccepted: true,
  },
  {
    apis: 'kong',
    createdAt: '1234567890',
    description: 'super chill',
    email: 'fbag@hobbiton.com',
    firstName: 'Frodo',
    lastName: 'Baggins',
    oAuthRedirectURI: 'http://elvish-swords.com',
    organization: 'The Fellowship',
    tosAccepted: true,
  },
];

describe('Merge User Dynamo Items', () => {
  it('merges users with identical emails', () => {
    const items: UserDynamoItem[] = mergeUserDynamoItems(mockDynamoItems);
    expect(items).toStrictEqual([
      {
        apis: 'kong,xy,dx,ab',
        createdAt: '1234567890',
        description: 'super chill',
        email: 'fbag@hobbiton.com',
        firstName: 'Frodo',
        lastName: 'Baggins',
        oAuthRedirectURI: 'http://elvish-swords.com',
        okta_application_id: 'another-okta-id,okta-id',
        organization: 'The Fellowship',
        tosAccepted: true,
      },
      {
        apis: 'va,xz,dx',
        createdAt: '1234567890',
        description: 'super cool',
        email: 'wizz@higherbeings.com',
        firstName: 'Gandalf',
        lastName: 'Gray',
        oAuthRedirectURI: 'http://wanna-use-magic.com',
        organization: 'The Fellowship',
        tosAccepted: true,
      },
    ]);
  });
});
