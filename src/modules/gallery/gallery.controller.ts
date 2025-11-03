import catchAsync from 'src/utils/catchAsync';
import galleryService from './gallery.service';
import sendResponse from 'src/utils/sendResponse';

const getAllImages = catchAsync(async (req, res) => {
    const images = await galleryService.getAllImages();

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Images retrieved successfully',
        data: images,
    });
});

const createImage = catchAsync(async (req, res) => {
    const images = await galleryService.createImage(req);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Image(s) uploaded successfully',
        data: images,
    });
});

const deleteImage = catchAsync(async (req, res) => {
    const { id } = req.params;
    const image = await galleryService.deleteImage(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Image deleted successfully',
        data: image,
    });
});

const galleryController = {
    getAllImages,
    createImage,
    deleteImage,
};

export default galleryController;
