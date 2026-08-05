"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRoutes = void 0;
// server/routes/review.routes.ts
const express_1 = require("express");
const review_controller_1 = require("./review.controller");
const router = (0, express_1.Router)();
router.get('/', review_controller_1.reviewController.getAllReviews);
router.get('/:id', review_controller_1.reviewController.getReviewById);
router.post('/', review_controller_1.reviewController.createReview);
router.put('/:id', review_controller_1.reviewController.updateReview);
router.put('/:id/status', review_controller_1.reviewController.updateReviewStatus);
router.delete('/:id', review_controller_1.reviewController.deleteReview);
exports.reviewRoutes = router;
