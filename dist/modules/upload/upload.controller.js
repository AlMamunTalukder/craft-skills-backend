"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const upload_service_1 = __importDefault(require("./upload.service"));
const logger_1 = __importDefault(require("../../shared/logger"));
const uploadImage = (0, catchAsync_1.default)(async (req, res) => {
    if (!req.file) {
        return (0, sendResponse_1.default)(res, {
            statusCode: 400,
            success: false,
            message: 'No file uploaded',
            data: null,
        });
    }
    // Check if file is too large (base64 will be ~33% larger)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
        return (0, sendResponse_1.default)(res, {
            statusCode: 400,
            success: false,
            message: 'File size should be less than 5MB',
            data: null,
        });
    }
    try {
        // Try Cloudinary upload first
        const result = await upload_service_1.default.uploadToCloudinary(req.file);
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: 'Image uploaded successfully to Cloudinary',
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                bytes: result.bytes,
                isBase64: false,
            },
        });
    }
    catch (error) {
        logger_1.default.error(error, 'Cloudinary upload failed:');
        // Fallback to base64 only if absolutely necessary
        // But first, let's check why Cloudinary failed
        if (!process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_CLOUD_KEY ||
            !process.env.CLOUDINARY_CLOUD_SECRET) {
            logger_1.default.error('Cloudinary credentials are missing in environment variables');
        }
        // Use base64 as fallback (temporary storage)
        const base64 = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
        logger_1.default.warn('Using base64 fallback for image. Consider fixing Cloudinary configuration.');
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: 'Image uploaded (using base64 - Cloudinary configuration issue)',
            data: {
                url: dataUrl,
                publicId: null,
                isBase64: true,
                warning: 'Cloudinary configuration issue. Image stored as base64.',
            },
        });
    }
});
const uploadController = {
    uploadImage,
};
exports.default = uploadController;
