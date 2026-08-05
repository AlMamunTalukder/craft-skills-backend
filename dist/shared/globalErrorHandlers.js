"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("./logger"));
const setupGlobalErrorHandlers = () => {
    process.on('uncaughtException', (error) => {
        logger_1.default.error(error, 'Uncaught Exception:');
        process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
        // Log and CONTINUE. Exiting here on transient errors (Redis/Mongo/queue
        // flakiness) causes crash/restart loops under a process manager = CPU 100%.
        if (reason instanceof Error) {
            logger_1.default.error(reason, 'Unhandled Rejection:');
        }
        else {
            logger_1.default.error({ reason }, 'Unhandled Rejection:');
        }
    });
};
exports.default = setupGlobalErrorHandlers;
