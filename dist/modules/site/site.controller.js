"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.siteController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const site_service_1 = __importDefault(require("./site.service"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const redis_1 = __importDefault(require("../../config/redis"));
const getSiteData = (0, catchAsync_1.default)(async (req, res) => {
    const result = await site_service_1.default.getSiteData();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Site data fetched successfully',
        data: result,
    });
});
const updateSiteData = (0, catchAsync_1.default)(async (req, res) => {
    const result = await site_service_1.default.updateSiteData(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Site data updated successfully',
        data: result,
    });
});
const updateMenuSettings = (0, catchAsync_1.default)(async (req, res) => {
    const menuSettings = req.body;
    // Get current site data
    let siteData = await site_service_1.default.getSiteData();
    if (!siteData) {
        throw new Error('Site data not found');
    }
    // Convert to plain object if needed
    const siteDataPlain = siteData.toObject ? siteData.toObject() : siteData;
    // Update only menu settings
    const updatedData = {
        ...siteDataPlain,
        menuSettings: {
            ...siteDataPlain.menuSettings,
            ...menuSettings,
        },
    };
    const result = await site_service_1.default.updateSiteData(updatedData);
    // ✅ Force cache invalidation
    await redis_1.default.del('site_data');
    await redis_1.default.set('site_data', JSON.stringify(result));
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Menu settings updated successfully',
        data: result,
    });
});
exports.siteController = {
    updateSiteData,
    getSiteData,
    updateMenuSettings,
};
// import catchAsync from '../../utils/catchAsync';
// import siteService from './site.service';
// import sendResponse from '../../utils/sendResponse';
// const getSiteData = catchAsync(async (req, res) => {
//     const result = await siteService.getSiteData();
//     sendResponse(res, {
//         statusCode: 200,
//         success: true,
//         message: 'Site data fetched successfully',
//         data: result,
//     });
// });
// const updateSiteData = catchAsync(async (req, res) => {
//     const result = await siteService.updateSiteData(req.body);
//     sendResponse(res, {
//         statusCode: 200,
//         success: true,
//         message: 'Site data updated successfully',
//         data: result,
//     });
// });
// const updateMenuSettings = catchAsync(async (req, res) => {
//     const menuSettings = req.body;
//     // Get current site data
//     let siteData = await siteService.getSiteData();
//     if (!siteData) {
//         throw new Error('Site data not found');
//     }
//     // Convert to plain object if needed
//     const siteDataPlain = siteData.toObject ? siteData.toObject() : siteData;
//     // Update only menu settings
//     const updatedData = {
//         ...siteDataPlain,
//         menuSettings: {
//             ...siteDataPlain.menuSettings,
//             ...menuSettings,
//         },
//     };
//     const result = await siteService.updateSiteData(updatedData);
//     sendResponse(res, {
//         statusCode: 200,
//         success: true,
//         message: 'Menu settings updated successfully',
//         data: result,
//     });
// });
// export const siteController = {
//     updateSiteData,
//     getSiteData,
//     updateMenuSettings,
// };
