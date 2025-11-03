import type { UploadApiResponse } from 'cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import httpStatus from 'http-status';
import path from 'path';
import config from 'src/config';
import AppError from 'src/errors/AppError';

cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_CLOUD_KEY,
    api_secret: config.CLOUDINARY_CLOUD_SECRET,
});
export const cloudinaryConfig = cloudinary;

export const uploadImage = async (file: any): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(file.path, { folder: 'craftskills' }, (error, result) => {
            if (error) {
                return reject(
                    new AppError(httpStatus.BAD_REQUEST, error.message || 'Error uploading image'),
                );
            }

            if (!result) {
                return reject(new AppError(httpStatus.BAD_REQUEST, 'Error uploading image'));
            }

            resolve(result);
        });
    });
};

const allowedExtensions = new Set(['jpeg', 'jpg', 'png', 'webp']);

export const upload = multer({
    storage: multer.diskStorage({}),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB
        files: 5,
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
        const mimeType = file.mimetype.split('/').pop()?.toLowerCase();

        if (allowedExtensions.has(ext) && allowedExtensions.has(mimeType || '')) {
            return cb(null, true);
        }

        return cb(
            new AppError(
                httpStatus.BAD_REQUEST,
                'Only images, pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv files are allowed',
            ),
        );
    },
});
