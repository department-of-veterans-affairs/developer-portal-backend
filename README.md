# Developer Portal Backend

This Express server will supercede the existing [Lambda function](https://github.com/department-of-veterans-affairs/developer-portal-lambda-backend) and become the backend of the [Developer Portal](https://developer.va.gov/apply).

## Getting Started

This Express server is written in TypeScript and requires [Node v12+](https://nodejs.org/en/download/).

First install the dependencies:
```
npm install
```

### Commands

- `npm start`: run the server as currently compiled
- `npm run watch`: compile code and restart the server when any files are changed
- `npm test`: run tests 
- `npm run test:watch`: rerun tests when any files are changed

### Docker
- `docker-compose up`: brings up the containers to run the application
- `docker-compose run app jest` runs the test suite
