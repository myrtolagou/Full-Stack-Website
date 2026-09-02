/**
 * server.js
 *
 * Entry point for the BcnCor backend.
 * Responsibilities:
 *  - Load environment variables via config/env.js
 *  - Import the configured Express app from app.js
 *  - Start the HTTP server on the configured PORT
 *  - Log startup confirmation
 *
 * Usage:
 *  node src/server.js          (production)
 *  nodemon src/server.js       (development — auto-restarts on file changes)
 */

const { env } = require('./config/env');
const app = require('./app');
const { seedUsers } = require('./controllers/usersController');

const PORT = env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[server] BcnCor API running on http://localhost:${PORT}`);
  console.log(`[server] Environment: ${env.NODE_ENV}`);
  seedUsers();
});
