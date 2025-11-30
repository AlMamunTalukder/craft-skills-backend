import redisClient from 'src/config/redis';
import type { SiteDto } from './site.dto';
import type { ISite } from './site.interface';
import Site from './site.model';
import logger from 'src/shared/logger';

const CACHE_KEY = 'site_data';

const getSiteData = async (): Promise<ISite | null> => {
    const cachedData = await redisClient.get(CACHE_KEY);
    if (cachedData) {
        logger.info('Site data retrieved from cache');
        return JSON.parse(cachedData) as ISite;
    }

    const siteData = await Site.findOne();
    if (siteData) {
        await redisClient.set(CACHE_KEY, JSON.stringify(siteData));
        logger.info('Site data retrieved from MongoDB & cached permanently');
    }
    return siteData;
};

// In your site.service.ts - updateSiteData function
const updateSiteData = async (data: SiteDto): Promise<ISite | null> => {
    // console.log('=== UPDATE SITE DATA SERVICE ===');
    // console.log('Received data keys:', Object.keys(data));
    // console.log('Logo Light in data:', data.logoLight);
    // console.log('Logo Dark in data:', data.logoDark);
    // console.log('Full data:', data);

    const updatedSite = await Site.findOneAndUpdate({}, data, { new: true });

    console.log('Updated site:', updatedSite);

    if (updatedSite) {
        await redisClient.set(CACHE_KEY, JSON.stringify(updatedSite));
        logger.info('Site data updated in MongoDB & cache');
    }

    return updatedSite;
};

const siteService = {
    updateSiteData,
    getSiteData,
};

export default siteService;
