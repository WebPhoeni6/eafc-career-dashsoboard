const app = require('./app');
const prisma = require('./config/database');
const config = require('./config/env');
const logger = require('./config/logger');

let server;

async function start() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    server = app.listen(config.PORT, () => {
      logger.info(`Server listening on port ${config.PORT}`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
