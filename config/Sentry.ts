import * as Sentry from '@sentry/node';
const { SENTRY_DSN, SENTRY_ENV } = process.env;
Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENV
});

export default Sentry;

