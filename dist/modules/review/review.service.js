"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewService = void 0;
const review_model_1 = require("./review.model");
const toResponseDto = (review) => ({
    _id: review._id.toString(),
    image: review.image,
    title: review.title,
    isActive: review.isActive,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
});
const getAllReviews = async () => {
    const reviews = await review_model_1.Review.find().sort({ createdAt: -1 }).lean();
    return reviews.map(toResponseDto);
};
const getReviewById = async (id) => {
    const review = await review_model_1.Review.findById(id).lean();
    if (!review)
        throw new Error('Review not found');
    return toResponseDto(review);
};
const createReview = async (createDto) => {
    const review = new review_model_1.Review(createDto);
    const savedReview = await review.save();
    return toResponseDto(savedReview.toObject());
};
const updateReview = async (id, updateDto) => {
    const review = await review_model_1.Review.findByIdAndUpdate(id, updateDto, {
        new: true,
        runValidators: true,
        lean: true,
    });
    if (!review)
        throw new Error('Review not found');
    return toResponseDto(review);
};
const deleteReview = async (id) => {
    const review = await review_model_1.Review.findByIdAndDelete(id);
    if (!review)
        throw new Error('Review not found');
};
const updateReviewStatus = async (id, isActive) => {
    const review = await review_model_1.Review.findByIdAndUpdate(id, { isActive }, { new: true, lean: true });
    if (!review)
        throw new Error('Review not found');
    return toResponseDto(review);
};
exports.reviewService = {
    getAllReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview,
    updateReviewStatus,
};
