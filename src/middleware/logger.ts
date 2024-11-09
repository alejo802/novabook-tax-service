import pino from 'pino';

// Configure the Pino logger
const logger = pino(
  {
    level: 'info',
  },
  process.env.NODE_ENV !== 'production'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard', // Format the timestamp
          ignore: 'pid,hostname',
        },
      })
    : undefined
);

export default logger;