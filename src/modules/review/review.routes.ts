// server/routes/review.routes.ts
import { Router } from 'express';
import { reviewController } from './review.controller';

const router = Router();

router.get('/', reviewController.getAllReviews);
router.get('/:id', reviewController.getReviewById);
router.post('/', reviewController.createReview);
router.put('/:id', reviewController.updateReview);
router.put('/:id/status', reviewController.updateReviewStatus);
router.delete('/:id', reviewController.deleteReview);

export const reviewRoutes = router;
