import 'jest';
import supertest from 'supertest';
import configureApp from '../app';
import SlackService from './SlackService';
require('dotenv').config({ path: './.env' });

const request = supertest(configureApp());
describe('Slack API', () => {
    it('should not return warning: "missing_charset" in the response data', async () => {
        const message = "A";
        const slack = new SlackService(process.env.SLACK_BASE_URL, process.env.SLACK_TOKEN, {channel: process.env.SLACK_CHANNEL, bot: process.env.SLACK_BOT});

        const response = await slack.sendSuccessMessage(message, 'New User Signup');
        expect(response).toEqual(expect.not.objectContaining({'warning': 'missing_charset'}));
    });
});