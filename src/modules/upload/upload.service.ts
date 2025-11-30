import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import config from 'src/config';
import logger from 'src/shared/logger';

// Debug Cloudinary configuration
logger.info('=== Cloudinary Configuration Check ===');
logger.info('Cloud Name:', config.CLOUDINARY_CLOUD_NAME);
logger.info(
    'API Key:',
    config.CLOUDINARY_CLOUD_KEY ? '***' + config.CLOUDINARY_CLOUD_KEY.slice(-4) : 'NOT SET',
);
logger.info(
    'API Secret:',
    config.CLOUDINARY_CLOUD_SECRET ? '***' + config.CLOUDINARY_CLOUD_SECRET.slice(-4) : 'NOT SET',
);

// Validate Cloudinary config
if (
    !config.CLOUDINARY_CLOUD_NAME ||
    !config.CLOUDINARY_CLOUD_KEY ||
    !config.CLOUDINARY_CLOUD_SECRET
) {
    logger.error('=== CLOUDINARY CONFIGURATION ERROR ===');
    logger.error('Missing Cloudinary environment variables');
    logger.error('Please check your .env file has actual Cloudinary credentials');
    logger.error('Current values - Cloud Name:', config.CLOUDINARY_CLOUD_NAME);
    logger.error('Current values - API Key:', config.CLOUDINARY_CLOUD_KEY ? 'SET' : 'NOT SET');
    logger.error(
        'Current values - API Secret:',
        config.CLOUDINARY_CLOUD_SECRET ? 'SET' : 'NOT SET',
    );
}

// Configure Cloudinary with YOUR variable names
cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_CLOUD_KEY, // Use CLOUD_KEY
    api_secret: config.CLOUDINARY_CLOUD_SECRET, // Use CLOUD_SECRET
});

interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

const uploadToCloudinary = async (file: MulterFile): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        logger.info('Starting Cloudinary upload for file:', file.originalname);

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto',
                folder: 'site-logos',
            },
            (error, result) => {
                if (error) {
                    logger.error('Cloudinary upload failed:', error.message);
                    reject(error);
                } else if (result) {
                    logger.info('Cloudinary upload successful:', result.secure_url);
                    resolve(result);
                } else {
                    const noResultError = new Error('Upload failed: No result from Cloudinary');
                    logger.error(noResultError.message);
                    reject(noResultError);
                }
            },
        );

        uploadStream.end(file.buffer);
    });
};

const uploadService = {
    uploadToCloudinary,
};

export default uploadService;
