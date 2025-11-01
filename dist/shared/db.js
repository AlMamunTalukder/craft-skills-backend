"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = __importDefault(require("../config/index"));
const logger_1 = __importDefault(require("./logger"));
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(index_1.default.databaseUrl);
        logger_1.default.info('MongoDB connected successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to connect to MongoDB', error);
        process.exit(1);
    }
};
exports.default = connectDB;
