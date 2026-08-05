"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.uploadImage = exports.cloudinaryConfig = void 0;
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
const http_status_1 = __importDefault(require("http-status"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
const AppError_1 = __importDefault(require("../errors/AppError"));
cloudinary_1.v2.config({
    cloud_name: config_1.default.CLOUDINARY_CLOUD_NAME,
    api_key: config_1.default.CLOUDINARY_CLOUD_KEY,
    api_secret: config_1.default.CLOUDINARY_CLOUD_SECRET,
});
exports.cloudinaryConfig = cloudinary_1.v2;
const uploadImage = async (file) => {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.upload(file.path, { folder: 'craftskills' }, (error, result) => {
            if (error) {
                return reject(new AppError_1.default(http_status_1.default.BAD_REQUEST, error.message || 'Error uploading image'));
            }
            if (!result) {
                return reject(new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Error uploading image'));
            }
            resolve(result);
        });
    });
};
exports.uploadImage = uploadImage;
const allowedExtensions = new Set(['jpeg', 'jpg', 'png', 'webp']);
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({}),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB
        files: 5,
    },
    fileFilter: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase().replace('.', '');
        const mimeType = file.mimetype.split('/').pop()?.toLowerCase();
        if (allowedExtensions.has(ext) && allowedExtensions.has(mimeType || '')) {
            return cb(null, true);
        }
        return cb(new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Only images, pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv files are allowed'));
    },
});
