import pino from 'pino';
import path from 'path';

const logger = pino({
    level: 'info',
    transport: {
        targets: [
            {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                },
                level: 'info',
            },
            {
                target: 'pino/file',
                options: {
                    destination: path.join(process.cwd(), 'logs', 'error.log'),
                    mkdir: true,
                },
                level: 'error',
            },
            {
                target: 'pino/file',
                options: {
                    destination: path.join(process.cwd(), 'logs', 'combined.log'),
                    mkdir: true,
                },
                level: 'info',
            },
        ],
    },
});

export default logger;
