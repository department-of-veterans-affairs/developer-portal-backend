import 'jest';
import { SlackClient } from './SlackClient';
import { User } from './models';
import { WebClient } from '@slack/client';
jest.mock('@slack/client', () => {
  return {
    WebClient: jest.fn().mockImplementation(() => {
      return {
        chat: {
          postMessage: jest.fn((_) => Promise.resolve({})),
        }
      }
    }),
  }
});

describe("sendSuccessMessage", () => {
  it('should send a slack message', async (done) => {
    const message = "Test, User: test@example.com\nRequested access to:\n* va_facilities\n* health\n"
    const client = new SlackClient({ token: 'fakeToken', channelID: 'fakeChannel' });
    await client.sendSuccessMessage(message, "New User Application");
    expect(client.client.chat.postMessage).toHaveBeenCalledWith({
      channel: 'fakeChannel',
      text: "",
      attachments: [{
        "color": "good",
        "fallback": "Test, User: test@example.com\nRequested access to:\n* va_facilities\n* health\n",
        "text":  "Test, User: test@example.com\nRequested access to:\n* va_facilities\n* health\n",
        "title": "New User Application"
      }]
    });
    done();
  });
});

describe("sendFailureMessage", () => {
  it('should send a slack message', async (done) => {
    const message = "Test, User: test@example.com\nRequested access to:\n* va_facilities\n* health\n"
    const client = new SlackClient({ token: 'fakeToken', channelID: 'fakeChannel' });
    await client.sendFailureMessage(message, "User signup failed");
    expect(client.client.chat.postMessage).toHaveBeenCalledWith({
      channel: 'fakeChannel',
      text: "",
      attachments: [{
        "color": "danger",
        "fallback": "Test, User: test@example.com\nRequested access to:\n* va_facilities\n* health\n",
        "text":  "Test, User: test@example.com\nRequested access to:\n* va_facilities\n* health\n",
        "title": "User signup failed"
      }]
    });
    done();
  });
});
