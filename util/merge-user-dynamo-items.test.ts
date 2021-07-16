import 'jest';
import { mergeUserDynamoItems } from './merge-user-dynamo-items';
import { UserDynamoItem } from '../models/User';

const mockDynamoItems: UserDynamoItem[] = [
  {
    firstName: 'Frodo',
    lastName: 'Baggins',
    organization: 'The Fellowship',
    email: 'fbag@hobbiton.com',
    apis: 'ab',
    description: 'super chill',
    oAuthRedirectURI: 'http://elvish-swords.com',
    tosAccepted: true,
    createdAt: '1234567890',
    okta_application_id: 'okta-id',
    okta_client_id: 'okta-client-id',
  },
  {
    firstName: 'Gandalf',
    lastName: 'Gray',
    organization: 'The Fellowship',
    email: 'wizz@higherbeings.com',
    apis: 'va,xz,dx',
    description: 'super cool',
    oAuthRedirectURI: 'http://wanna-use-magic.com',
    tosAccepted: true,
    createdAt: '1234567890',
  },
  {
    firstName: 'Frodo',
    lastName: 'Baggins',
    organization: 'The Fellowship',
    email: 'fbag@hobbiton.com',
    apis: 'xy,dx',
    description: 'super chill',
    oAuthRedirectURI: 'http://elvish-swords.com',
    tosAccepted: true,
    createdAt: '1234567890',
    okta_application_id: 'another-okta-id',
    okta_client_id: 'okta-client-id',
  },
  {
    firstName: 'Frodo',
    lastName: 'Baggins',
    organization: 'The Fellowship',
    email: 'fbag@hobbiton.com',
    apis: 'kong',
    description: 'super chill',
    oAuthRedirectURI: 'http://elvish-swords.com',
    tosAccepted: true,
    createdAt: '1234567890',
  },
];

describe('Merge User Dynamo Items', () => {
  it('merges users with identical emails', () => {
    const items: UserDynamoItem[] = mergeUserDynamoItems(mockDynamoItems);
    expect(items).toStrictEqual([
      {
        firstName: 'Frodo',
        lastName: 'Baggins',
        organization: 'The Fellowship',
        email: 'fbag@hobbiton.com',
        apis: 'kong,xy,dx,ab',
        description: 'super chill',
        oAuthRedirectURI: 'http://elvish-swords.com',
        tosAccepted: true,
        createdAt: '1234567890',
        okta_application_id: 'another-okta-id,okta-id',
      },
      {
        firstName: 'Gandalf',
        lastName: 'Gray',
        organization: 'The Fellowship',
        email: 'wizz@higherbeings.com',
        apis: 'va,xz,dx',
        description: 'super cool',
        oAuthRedirectURI: 'http://wanna-use-magic.com',
        tosAccepted: true,
        createdAt: '1234567890',
      },
    ]);
  });
});
