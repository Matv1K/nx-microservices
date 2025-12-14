import { createLogger } from '@intern-project/logger';

const logger = createLogger({
  serviceName: 'posts-microservice',
  logLevel: process.env.LOG_LEVEL || 'info',
});

export default logger;

