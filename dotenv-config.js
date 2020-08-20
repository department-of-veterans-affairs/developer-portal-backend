// dotenv doesn't provide an override option, so this will allow the .env.test to decide the environment
delete process.env.NODE_ENV;
require('dotenv').config({ path: './.env.test' });