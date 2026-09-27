"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const config_1 = __importDefault(require("../../config"));
const logger_1 = __importDefault(require("../../shared/logger"));
cloudinary_1.v2.config({
    cloud_name: config_1.default.CLOUDINARY_CLOUD_NAME,
    api_key: config_1.default.CLOUDINARY_CLOUD_KEY,
    api_secret: config_1.default.CLOUDINARY_CLOUD_SECRET,
});
const uploadToCloudinary = async (file) => {
    return new Promise((resolve, reject) => {
        logger_1.default.info('Starting Cloudinary upload for file: ' + file.originalname);
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            resource_type: 'auto',
            folder: 'site-logos',
        }, (error, result) => {
            if (error) {
                logger_1.default.error('Cloudinary upload failed: ' + error.message);
                reject(error);
            }
            else if (result) {
                logger_1.default.info('Cloudinary upload successful: ' + result.secure_url);
                resolve(result);
            }
            else {
                const noResultError = new Error('Upload failed: No result from Cloudinary');
                logger_1.default.error(noResultError.message);
                reject(noResultError);
            }
        });
        uploadStream.end(file.buffer);
    });
};
const uploadService = {
    uploadToCloudinary,
};
exports.default = uploadService;
