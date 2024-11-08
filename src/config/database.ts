import mongoose from 'mongoose';
import { config } from './config';

export const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('Connected to the database');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from the database');
  } catch (error) {
    console.error('Error disconnecting from the database:', error);
  }
};