import { captureException, configureScope, flush, init } from '@sentry/node';

const SENTRY_TIMEOUT_MS = 2000;

export class SentryClient {
  constructor({ dsn, event }) {
    init({ dsn });
    configureScope((scope) => {
      scope.setExtras(event);
    });
  }

  public async sendFailure(failure: Error) {
    try {
      captureException(failure);
    } catch (error) {
      console.log('Unable to send sentry failure...');
      console.log(error);
    }
    return flush(SENTRY_TIMEOUT_MS);
  }
}
