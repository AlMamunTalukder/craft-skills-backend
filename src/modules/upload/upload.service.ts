import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import config from 'src/config';
import logger from 'src/shared/logger';

cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_CLOUD_KEY,
    api_secret: config.CLOUDINARY_CLOUD_SECRET,
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
        logger.info('Starting Cloudinary upload for file: ' + file.originalname);

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto',
                folder: 'site-logos',
            },
            (error, result) => {
                if (error) {
                    logger.error('Cloudinary upload failed: ' + error.message);
                    reject(error);
                } else if (result) {
                    logger.info('Cloudinary upload successful: ' + result.secure_url);
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
