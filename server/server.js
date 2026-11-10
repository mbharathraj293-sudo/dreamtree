import dotenv from 'dotenv';
import app from './app.js';
import prisma from './config/db.js';
import logger from './utils/logger.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // Verify connection to the database
    logger.info('Connecting to the PostgreSQL database via Prisma...');
    await prisma.$connect();
    logger.info('Database connection established successfully.');

    // Launch Express listener
    app.listen(PORT, () => {
      logger.info(`Server successfully launched in '${process.env.NODE_ENV || 'development'}' mode.`);
      logger.info(`Customer Website accessible at http://localhost:${PORT}`);
      logger.info(`Admin Management Panel accessible at http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    logger.error('Failed to initialize server or database connection:', error);
    process.exit(1);
  }
}

// Global promise rejection capture
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection detected:', err);
});

bootstrap();
