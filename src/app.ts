import express from 'express';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import logger from './middleware/logger';
import pinoHttp from 'pino-http';

const app = express();

app.use(express.json()); 

// Middleware
app.use(helmet());

// Use pino-http middleware to log incoming requests and responses
app.use(pinoHttp({ logger }));

app.use((req, res, next) => {
  req.log.info({ req }, 'Request received');
  next();
});

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

export default app;