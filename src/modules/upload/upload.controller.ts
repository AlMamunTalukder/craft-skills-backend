import type { Request, Response } from 'express';
import catchAsync from 'src/utils/catchAsync';
import sendResponse from 'src/utils/sendResponse';
import uploadService from './upload.service';
import logger from 'src/shared/logger';

const uploadImage = catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: 'No file uploaded',
            data: null,
        });
    }

    // Check if Cloudinary is configured
    const hasCloudinaryConfig =
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_CLOUD_KEY &&
        process.env.CLOUDINARY_CLOUD_SECRET;

    if (!hasCloudinaryConfig) {
        logger.warn('Cloudinary not configured, using base64 fallback');

        // Use base64 as fallback
        const base64 = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Image uploaded successfully (base64)',
            data: {
                url: dataUrl,
                publicId: null,
                isBase64: true,
            },
        });
    }

    try {
        // Try Cloudinary upload
        const result = await uploadService.uploadToCloudinary(req.file);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                isBase64: false,
            },
        });
    } catch (error) {
        logger.error('Cloudinary upload failed:', error);

        // Fallback to base64
        const base64 = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Image uploaded (base64 fallback)',
            data: {
                url: dataUrl,
                publicId: null,
                isBase64: true,
            },
        });
    }
});

const uploadController = {
    uploadImage,
};

export default uploadController;
