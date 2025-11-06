import type { Request } from 'express';
import type { IGallery } from './gallery.interface';
import AppError from 'src/errors/AppError';
import httpStatus from 'http-status';
import { cloudinaryConfig, uploadImage } from 'src/utils/cloudinary';
import Gallery from './gallery.model';

const createImage = async (req: Request): Promise<IGallery[] | null> => {
    const files = req.files;

    if (!files || Object.keys(files).length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Please upload an image');
    }

    const uploadedImages: any[] = [];
    const fileList = Array.isArray(files) ? files : Object.values(files);

    for (const file of fileList) {
        const image = file as any;

        const { secure_url, public_id } = await uploadImage(image);

        uploadedImages.push({
            url: secure_url,
            publicId: public_id,
            name: image.originalname,
        });
    }

    const createdImages = await Gallery.insertMany(uploadedImages);
    return createdImages;
};

const getAllImages = async (
    page = 1,
    limit = 30,
): Promise<{ images: IGallery[]; totalPages: number }> => {
    const skip = (page - 1) * limit;
    const total = await Gallery.countDocuments();
    const images = await Gallery.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

    const totalPages = Math.ceil(total / limit);

    return { images, totalPages };
};

const deleteImage = async (id: string): Promise<IGallery | null> => {
    const image = await Gallery.findByIdAndDelete(id);

    if (!image) {
        throw new AppError(httpStatus.NOT_FOUND, 'Image not found');
    }

    await cloudinaryConfig.uploader.destroy(image.publicId);

    return image;
};

const galleryService = {
    createImage,
    getAllImages,
    deleteImage,
};

export default galleryService;
