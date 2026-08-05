import pino from 'pino';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
    level: 'info',
    transport: {
        targets: [
            ...(isProd
                ? [
                      {
                          target: 'pino/file',
                          options: {
                              destination: 1,
                          },
                          level: 'info',
                      },
                  ]
                : [
                      {
                          target: 'pino-pretty',
                          options: {
                              colorize: true,
                          },
                          level: 'info',
                      },
                  ]),
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
