"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("./logger"));
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(config_1.default.databaseUrl, {
            maxPoolSize: 100,
            minPoolSize: 10,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
            tls: true,
        });
        logger_1.default.info('MongoDB connected successfully with connection pool (max 100)');
    }
    catch (error) {
        logger_1.default.error(error, 'Failed to connect MongoDB');
        process.exit(1);
    }
};
exports.default = connectDB;
// import mongoose from 'mongoose';
// import config from '../config/index';
// import logger from './logger';
// const connectDB = async (): Promise<void> => {
//     try {
//         await mongoose.connect(config.databaseUrl as string);
//         logger.info('MongoDB connected successfully');
//     } catch (error) {
//         logger.error(error, 'Failed to connect to MongoDB');
//         process.exit(1);
//     }
// };
// export default connectDB;
