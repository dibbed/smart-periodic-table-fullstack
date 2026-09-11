/**
 * Legacy reset-db script adapter
 * Delegates to scripts/seed.js with --reset
 */
const { runSeed } = require('./seed');
runSeed({ forceReset: true });
