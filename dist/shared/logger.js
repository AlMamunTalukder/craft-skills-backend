"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const path_1 = __importDefault(require("path"));
const logger = (0, pino_1.default)({
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
                    destination: path_1.default.join(process.cwd(), 'logs', 'error.log'),
                    mkdir: true,
                },
                level: 'error',
            },
            {
                target: 'pino/file',
                options: {
                    destination: path_1.default.join(process.cwd(), 'logs', 'combined.log'),
                    mkdir: true,
                },
                level: 'info',
            },
        ],
    },
});
exports.default = logger;
