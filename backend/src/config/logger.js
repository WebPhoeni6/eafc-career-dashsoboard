const pino = require('pino');
const config = require('./env');

const transport =
  config.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

const logger = pino({
  level: config.LOG_LEVEL,
  transport,
});

module.exports = logger;
