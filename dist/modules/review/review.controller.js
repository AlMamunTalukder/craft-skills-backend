"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewController = void 0;
const review_service_1 = require("./review.service");
exports.reviewController = {
    getAllReviews: async (req, res) => {
        try {
            const reviews = await review_service_1.reviewService.getAllReviews();
            res.json({ success: true, data: reviews });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch reviews',
            });
        }
    },
    getReviewById: async (req, res) => {
        try {
            const id = req.params.id;
            const review = await review_service_1.reviewService.getReviewById(id);
            res.json({ success: true, data: review });
        }
        catch (error) {
            const status = error instanceof Error && error.message === 'Review not found' ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch review',
            });
        }
    },
    createReview: async (req, res) => {
        try {
            const { title, isActive, image } = req.body;
            if (!image) {
                return res.status(400).json({
                    success: false,
                    message: 'Image is required',
                });
            }
            // Validate that image is not a base64 string (too long for Cloudinary URL)
            if (image.startsWith('data:image/') && image.includes('base64,')) {
                // This is a base64 image, which shouldn't be saved to database
                // Client should upload to /upload endpoint first
                return res.status(400).json({
                    success: false,
                    message: 'Please use the upload endpoint to get a Cloudinary URL first',
                });
            }
            // Check if it's a valid URL (Cloudinary URLs start with https://res.cloudinary.com/)
            if (!image.startsWith('https://res.cloudinary.com/')) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid image URL. Must be a Cloudinary URL',
                });
            }
            const reviewData = {
                image,
                title: title || '',
                isActive: isActive === 'true' || isActive === true,
            };
            const review = await review_service_1.reviewService.createReview(reviewData);
            res.status(201).json({ success: true, data: review });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create review',
            });
        }
    },
    updateReview: async (req, res) => {
        try {
            const id = req.params.id;
            const { title, isActive, image } = req.body;
            const updateData = {};
            if (image !== undefined)
                updateData.image = image;
            if (title !== undefined)
                updateData.title = title;
            if (isActive !== undefined) {
                updateData.isActive = isActive === 'true' || isActive === true;
            }
            const review = await review_service_1.reviewService.updateReview(id, updateData);
            res.json({ success: true, data: review });
        }
        catch (error) {
            const status = error instanceof Error && error.message === 'Review not found' ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update review',
            });
        }
    },
    deleteReview: async (req, res) => {
        try {
            const id = req.params.id;
            await review_service_1.reviewService.deleteReview(id);
            res.json({ success: true, message: 'Review deleted successfully' });
        }
        catch (error) {
            const status = error instanceof Error && error.message === 'Review not found' ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to delete review',
            });
        }
    },
    updateReviewStatus: async (req, res) => {
        try {
            const id = req.params.id;
            const { isActive } = req.body;
            if (typeof isActive !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'isActive must be a boolean',
                });
            }
            const review = await review_service_1.reviewService.updateReviewStatus(id, isActive);
            res.json({ success: true, data: review });
        }
        catch (error) {
            const status = error instanceof Error && error.message === 'Review not found' ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update review status',
            });
        }
    },
};
