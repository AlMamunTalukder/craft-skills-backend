import catchAsync from 'src/utils/catchAsync';
import siteService from './site.service';
import sendResponse from 'src/utils/sendResponse';

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

export const siteController = {
    updateSiteData,
    getSiteData,
};
