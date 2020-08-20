// dotenv doesn't provide an override option, so this will allow the .test.env to decide the environment
delete process.env.NODE_ENV;
require('dotenv').config({ path: './.test.env' });