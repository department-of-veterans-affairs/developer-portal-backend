import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    new transports.Console({
      // Don't log during test runs
      silent: process.env.NODE_ENV === 'test',
    })
  ],
});

export default logger;
