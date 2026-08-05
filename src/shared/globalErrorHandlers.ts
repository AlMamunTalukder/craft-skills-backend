import logger from './logger';

const setupGlobalErrorHandlers = (): void => {
    process.on('uncaughtException', (error) => {
        logger.error(error, 'Uncaught Exception:');
        process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
        // Log and CONTINUE. Exiting here on transient errors (Redis/Mongo/queue
        // flakiness) causes crash/restart loops under a process manager = CPU 100%.
        if (reason instanceof Error) {
            logger.error(reason, 'Unhandled Rejection:');
        } else {
            logger.error({ reason }, 'Unhandled Rejection:');
        }
    });
};

export default setupGlobalErrorHandlers;
