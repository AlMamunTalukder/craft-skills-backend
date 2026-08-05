"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const gallery_service_1 = __importDefault(require("./gallery.service"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const getAllImages = (0, catchAsync_1.default)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const { images, totalPages } = await gallery_service_1.default.getAllImages(page, limit);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Images retrieved successfully',
        data: { images, totalPages },
    });
});
const createImage = (0, catchAsync_1.default)(async (req, res) => {
    const images = await gallery_service_1.default.createImage(req);
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: 'Image(s) uploaded successfully',
        data: images,
    });
});
const deleteImage = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const image = await gallery_service_1.default.deleteImage(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Image deleted successfully',
        data: image,
    });
});
const galleryController = {
    getAllImages,
    createImage,
    deleteImage,
};
exports.default = galleryController;
