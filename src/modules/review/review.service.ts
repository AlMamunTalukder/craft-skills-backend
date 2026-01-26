// server/services/review.service.ts
import type { ReviewResponse, CreateReviewDto, UpdateReviewDto } from './review.dto';
import { Review } from './review.model';

const toResponseDto = (review: any): ReviewResponse => ({
    _id: review._id.toString(),
    image: review.image,
    title: review.title,
    isActive: review.isActive,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
});

const getAllReviews = async (): Promise<ReviewResponse[]> => {
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    return reviews.map(toResponseDto);
};

const getReviewById = async (id: string): Promise<ReviewResponse> => {
    const review = await Review.findById(id).lean();
    if (!review) throw new Error('Review not found');
    return toResponseDto(review);
};

const createReview = async (createDto: CreateReviewDto): Promise<ReviewResponse> => {
    const review = new Review(createDto);
    const savedReview = await review.save();
    return toResponseDto(savedReview.toObject());
};

const updateReview = async (id: string, updateDto: UpdateReviewDto): Promise<ReviewResponse> => {
    const review = await Review.findByIdAndUpdate(id, updateDto, {
        new: true,
        runValidators: true,
        lean: true,
    });

    if (!review) throw new Error('Review not found');
    return toResponseDto(review);
};

const deleteReview = async (id: string): Promise<void> => {
    const review = await Review.findByIdAndDelete(id);
    if (!review) throw new Error('Review not found');
};

const updateReviewStatus = async (id: string, isActive: boolean): Promise<ReviewResponse> => {
    const review = await Review.findByIdAndUpdate(id, { isActive }, { new: true, lean: true });

    if (!review) throw new Error('Review not found');
    return toResponseDto(review);
};

export const reviewService = {
    getAllReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview,
    updateReviewStatus,
};
