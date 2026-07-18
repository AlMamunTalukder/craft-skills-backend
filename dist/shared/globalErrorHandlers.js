"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("./logger"));
const setupGlobalErrorHandlers = () => {
    process.on('uncaughtException', (error) => {
        logger_1.default.error('Uncaught Exception:', error);
        process.exit(1);
    });
    process.on("unhandledRejection", (reason) => {
        console.error("===========");
        console.error(reason);
        if (reason instanceof Error) {
            console.error(reason.stack);
        }
        process.exit(1);
    });
    // process.on('unhandledRejection', (reason, promise) => {
    //     logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    //     process.exit(1);
    // });
};
exports.default = setupGlobalErrorHandlers;
