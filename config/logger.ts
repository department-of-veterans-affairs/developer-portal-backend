import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  format: format.json(),
  level: 'info',
  transports: [
    new transports.Console({
      // Don't log during test runs
      silent: process.env.NODE_ENV === 'test',
    }),
  ],
});

export default logger;
