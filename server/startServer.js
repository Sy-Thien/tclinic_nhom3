// Wrapper to catch ANY uncaught errors
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
    process.exit(1);
});

console.log('🚀 Starting server with error handlers...');
require('./server.js');
