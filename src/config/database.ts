import mongoose from 'mongoose';
import { config } from './config';
import logger from '../middleware/logger';

export const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.database.uri);
    logger.info('Connected to the database');
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1); // Exit the process if unable to connect
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from the database');
  } catch (error) {
    logger.error('Error disconnecting from the database:', error);
  }
};