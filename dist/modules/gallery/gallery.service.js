"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const cloudinary_1 = require("../../utils/cloudinary");
const gallery_model_1 = __importDefault(require("./gallery.model"));
const createImage = async (req) => {
    const files = req.files;
    if (!files || Object.keys(files).length === 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Please upload an image');
    }
    const uploadedImages = [];
    const fileList = Array.isArray(files) ? files : Object.values(files);
    for (const file of fileList) {
        const image = file;
        const { secure_url, public_id } = await (0, cloudinary_1.uploadImage)(image);
        uploadedImages.push({
            url: secure_url,
            publicId: public_id,
            name: image.originalname,
        });
    }
    const createdImages = await gallery_model_1.default.insertMany(uploadedImages);
    return createdImages;
};
const getAllImages = async (page = 1, limit = 30) => {
    const skip = (page - 1) * limit;
    const total = await gallery_model_1.default.countDocuments();
    const images = await gallery_model_1.default.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalPages = Math.ceil(total / limit);
    return { images, totalPages };
};
const deleteImage = async (id) => {
    const image = await gallery_model_1.default.findByIdAndDelete(id);
    if (!image) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Image not found');
    }
    await cloudinary_1.cloudinaryConfig.uploader.destroy(image.publicId);
    return image;
};
const galleryService = {
    createImage,
    getAllImages,
    deleteImage,
};
exports.default = galleryService;
