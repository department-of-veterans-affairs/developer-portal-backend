/* eslint-disable @typescript-eslint/no-var-requires */

const mockServer = require('node-mock-server');
const path = require('path');

mockServer({
	'restPath': path.join(__dirname, '/service'),
	'uiPath': '/',
	'title': 'Api mock server',
	'version': 1,
	'urlBase': 'http://localhost:3001',
	'urlPath': '/service',
	'port': 3001,
	'contentType': 'application/json',
	'accessControlExposeHeaders': 'X-Total-Count',
	'accessControlAllowOrigin': '*',
	'accessControlAllowMethods': 'GET, POST, PUT, OPTIONS, DELETE, PATCH, HEAD',
	'accessControlAllowHeaders': 'origin, x-requested-with, content-type',
	'accessControlAllowCredentials': 'true',
	'headers': {},
	'open': true,
	'dirName': __dirname,
});
