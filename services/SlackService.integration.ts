import 'jest';
import SlackService from './SlackService';
require('dotenv').config({ path: './.env' });

describe('Slack API', () => {
    it('should not return warning: "missing_charset" in the response data', async () => {
        const message = "Even the smallest person can change the course of the future.";
        const slack = new SlackService(process.env.SLACK_BASE_URL, process.env.SLACK_TOKEN, {channel: process.env.SLACK_CHANNEL, bot: process.env.SLACK_BOT});

        const response = await slack.sendSuccessMessage(message, 'New User Signup');
        expect(response).toEqual(expect.not.objectContaining({'warning': 'missing_charset'}));
    });
});
