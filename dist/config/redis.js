"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = void 0;
const redis_1 = require("redis");
const index_1 = __importDefault(require("./index"));
const logger_1 = __importDefault(require("../shared/logger"));
const redisClient = (0, redis_1.createClient)({
    url: index_1.default.redisHost,
});
redisClient.on('connect', () => {
    logger_1.default.info('Redis connecting...');
});
redisClient.on('ready', () => {
    logger_1.default.info('Redis connected successfully');
});
redisClient.on('error', (err) => {
    logger_1.default.error(err, 'Redis Client Error');
});
redisClient.on('reconnecting', () => {
    logger_1.default.warn('Redis reconnecting...');
});
const connectRedis = async () => {
    await redisClient.connect();
};
exports.connectRedis = connectRedis;
exports.default = redisClient;
// import { createClient } from 'redis';
// import config from './index';
// import logger from '../shared/logger';
// const redisClient = createClient({
//     url: config.redisHost,
// });
// redisClient.on('error', (err) => logger.error(err, 'Redis Client Error'));
// export const connectRedis = async (): Promise<void> => {
//     await redisClient.connect();
//     logger.info('Redis connected successfully');
// };
// export default redisClient;
