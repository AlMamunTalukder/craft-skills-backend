import { createClient } from "redis";
import config from "./index";
import logger from "../shared/logger";

const redisClient = createClient({
    url: config.redisHost,
});

redisClient.on("connect", () => {
    logger.info("Redis connecting...");
});

redisClient.on("ready", () => {
    logger.info("Redis connected successfully");
});

redisClient.on("error", (err) => {
    logger.error("Redis Client Error", err);
});

redisClient.on("reconnecting", () => {
    logger.warn("Redis reconnecting...");
});

export const connectRedis = async () => {
    await redisClient.connect();
};

export default redisClient;


// import { createClient } from 'redis';
// import config from './index';
// import logger from '../shared/logger';

// const redisClient = createClient({
//     url: config.redisHost,
// });

// redisClient.on('error', (err) => logger.error('Redis Client Error', err));

// export const connectRedis = async (): Promise<void> => {
//     await redisClient.connect();
//     logger.info('Redis connected successfully');
// };

// export default redisClient;
