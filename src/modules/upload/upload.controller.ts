// upload.controller.ts
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

    // Check if file is too large (base64 will be ~33% larger)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: 'File size should be less than 5MB',
            data: null,
        });
    }

    try {
        // Try Cloudinary upload first
        const result = await uploadService.uploadToCloudinary(req.file);

        return sendResponse(res, {
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
    } catch (error) {
        logger.error('Cloudinary upload failed:', error);

        // Fallback to base64 only if absolutely necessary
        // But first, let's check why Cloudinary failed
        if (
            !process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_CLOUD_KEY ||
            !process.env.CLOUDINARY_CLOUD_SECRET
        ) {
            logger.error('Cloudinary credentials are missing in environment variables');
        }

        // Use base64 as fallback (temporary storage)
        const base64 = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

        logger.warn('Using base64 fallback for image. Consider fixing Cloudinary configuration.');

        return sendResponse(res, {
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

export default uploadController;
