"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = __importDefault(require("../../config/redis"));
const site_model_1 = __importDefault(require("./site.model"));
const logger_1 = __importDefault(require("../../shared/logger"));
const CACHE_KEY = 'site_data';
const getSiteData = async () => {
    try {
        const cachedData = await redis_1.default.get(CACHE_KEY);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
    }
    catch (err) {
        logger_1.default.warn(err, 'Redis get error, falling back to MongoDB');
    }
    const siteData = await site_model_1.default.findOne().lean();
    if (siteData) {
        try {
            await redis_1.default.set(CACHE_KEY, JSON.stringify(siteData));
        }
        catch (err) {
            logger_1.default.warn(err, 'Redis set error');
        }
    }
    return siteData;
};
const updateSiteData = async (data) => {
    const updatedSite = await site_model_1.default.findOneAndUpdate({}, data, { new: true });
    if (updatedSite) {
        await redis_1.default.set(CACHE_KEY, JSON.stringify(updatedSite));
        logger_1.default.info('Site data updated in MongoDB & cache');
    }
    return updatedSite;
};
const clearCache = async () => {
    await redis_1.default.del(CACHE_KEY);
    logger_1.default.info('Site cache cleared');
};
const siteService = {
    updateSiteData,
    getSiteData,
    clearCache,
};
exports.default = siteService;
// import redisClient from '../../config/redis';
// import type { SiteDto } from './site.dto';
// import type { ISite } from './site.interface';
// import Site from './site.model';
// import logger from '../../shared/logger';
// const CACHE_KEY = 'site_data';
// const getSiteData = async (): Promise<ISite | null> => {
//     const cachedData = await redisClient.get(CACHE_KEY);
//     if (cachedData) {
//         logger.info('Site data retrieved from cache');
//         return JSON.parse(cachedData) as ISite;
//     }
//     const siteData = await Site.findOne();
//     if (siteData) {
//         await redisClient.set(CACHE_KEY, JSON.stringify(siteData));
//         logger.info('Site data retrieved from MongoDB & cached permanently');
//     }
//     return siteData;
// };
// const updateSiteData = async (data: SiteDto): Promise<ISite | null> => {
//     const updatedSite = await Site.findOneAndUpdate({}, data, { new: true });
//     if (updatedSite) {
//         // ✅ Update cache with new data
//         await redisClient.set(CACHE_KEY, JSON.stringify(updatedSite));
//         logger.info('Site data updated in MongoDB & cache');
//     }
//     return updatedSite;
// };
// // ✅ Add a function to clear cache
// const clearCache = async (): Promise<void> => {
//     await redisClient.del(CACHE_KEY);
//     logger.info('Site cache cleared');
// };
// const siteService = {
//     updateSiteData,
//     getSiteData,
//     clearCache,
// };
// export default siteService;
