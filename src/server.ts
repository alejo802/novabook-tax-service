import app from './app';
import { config } from './config/config';
import { connectToDatabase, disconnectFromDatabase } from './config/database';

const PORT = config.server.port;

const startServer = async () => {
  try {
    await connectToDatabase(); // Connect to the database

    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    // Gracefully handle server shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received. Closing server.');
      server.close(async () => {
        await disconnectFromDatabase();
        console.log('Server closed.');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();