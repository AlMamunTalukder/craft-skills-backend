import catchAsync from 'src/utils/catchAsync';
import siteService from './site.service';
import sendResponse from 'src/utils/sendResponse';
import redisClient from 'src/config/redis';

const getSiteData = catchAsync(async (req, res) => {
    const result = await siteService.getSiteData();

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Site data fetched successfully',
        data: result,
    });
});

const updateSiteData = catchAsync(async (req, res) => {
    const result = await siteService.updateSiteData(req.body);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Site data updated successfully',
        data: result,
    });
});

const updateMenuSettings = catchAsync(async (req, res) => {
    const menuSettings = req.body;
    let siteData = await siteService.getSiteData();

    if (!siteData) {
        throw new Error('Site data not found');
    }

    const siteDataPlain = siteData.toObject ? siteData.toObject() : siteData;
    const updatedData = {
        ...siteDataPlain,
        menuSettings: {
            ...siteDataPlain.menuSettings,
            ...menuSettings,
        },
    };

    const result = await siteService.updateSiteData(updatedData);

    // ✅ Invalidate Redis cache
    await redisClient.del('site_data');

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Menu settings updated successfully',
        data: result,
    });
});

export const siteController = {
    updateSiteData,
    getSiteData,
    updateMenuSettings,
};
