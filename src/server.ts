import app from './app';
import { config } from './config/config';
import { connectToDatabase, disconnectFromDatabase } from './config/database';
import logger from './middleware/logger'; // Import logger from './middleware/logger'

const PORT = config.server.port;

const startServer = async () => {
  try {
    logger.info('Attempting to connect to the database...');

    await connectToDatabase(); // Connect to the database

    const server = app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });

    // Gracefully handle server shutdown
    process.on('SIGTERM', async () => {
      logger.warn('SIGTERM signal received. Closing server.');
      server.close(async () => {
        await disconnectFromDatabase();
        logger.info('Server closed.');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();