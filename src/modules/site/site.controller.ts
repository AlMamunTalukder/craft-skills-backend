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

const updatePdfSettings = catchAsync(async (req, res) => {
    const { showPdfMenu } = req.body;

    // Get current site data
    let siteData = await siteService.getSiteData();

    if (!siteData) {
        throw new Error('Site data not found');
    }

    // Update only the PDF settings
    const updatedData = {
        ...siteData.toObject(),
        showPdfMenu,
    };

    const result = await siteService.updateSiteData(updatedData);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'PDF settings updated successfully',
        data: result,
    });
});

export const siteController = {
    updateSiteData,
    getSiteData,
    updatePdfSettings,
};
