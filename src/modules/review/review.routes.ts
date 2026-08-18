// server/routes/review.routes.ts
import { Router } from 'express';
import { reviewController } from './review.controller';
import { auth } from 'src/middleware/auth';

const router = Router();

router.get('/', reviewController.getAllReviews);
router.get('/:id', reviewController.getReviewById);
router.post('/', auth(['admin']), reviewController.createReview);
router.put('/:id', auth(['admin']), reviewController.updateReview);
router.put('/:id/status', auth(['admin']), reviewController.updateReviewStatus);
router.delete('/:id', auth(['admin']), reviewController.deleteReview);

export const reviewRoutes = router;
