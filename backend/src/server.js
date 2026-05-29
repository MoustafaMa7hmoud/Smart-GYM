require('dotenv').config();

const app       = require('./app');
const connectDB = require('./config/db');
const logger    = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Initialise Cloudinary config eagerly
require('./config/cloudinary');

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`🚀  Smart Gym API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────
  const shutdown = (signal) => {
    logger.warn(`${signal} received — shutting down gracefully…`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
  });
};

startServer();
