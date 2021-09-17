// dotenv doesn't provide an override option, so this will allow the .env.test to decide the environment
process.env.NODE_ENV = 'test';
require('dotenv').config({ path: './.env.test' });
