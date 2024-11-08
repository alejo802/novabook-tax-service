import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

export const config = {
  server: {
    port: process.env.PORT || 3000,
  },
  database: {
    uri: process.env.DATABASE_URI || 'mongodb://localhost:27017/novabook',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  observability: {
    enable: process.env.ENABLE_OBSERVABILITY === 'true',
  },
};