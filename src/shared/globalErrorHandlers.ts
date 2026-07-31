import logger from './logger';

const setupGlobalErrorHandlers = (): void => {
    process.on('uncaughtException', (error) => {
        logger.error(error, 'Uncaught Exception:');
        process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
        console.error('===========');
        console.error(reason);

        if (reason instanceof Error) {
            console.error(reason.stack);
        }

        process.exit(1);
    });

    // process.on('unhandledRejection', (reason, promise) => {
    //     logger.error(promise, 'reason:', reason, 'Unhandled Rejection at:');
    //     process.exit(1);
    // });
};

export default setupGlobalErrorHandlers;
