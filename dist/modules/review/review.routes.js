"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRoutes = void 0;
// server/routes/review.routes.ts
const express_1 = require("express");
const review_controller_1 = require("./review.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', review_controller_1.reviewController.getAllReviews);
router.get('/:id', review_controller_1.reviewController.getReviewById);
router.post('/', (0, auth_1.auth)(['admin']), review_controller_1.reviewController.createReview);
router.put('/:id', (0, auth_1.auth)(['admin']), review_controller_1.reviewController.updateReview);
router.put('/:id/status', (0, auth_1.auth)(['admin']), review_controller_1.reviewController.updateReviewStatus);
router.delete('/:id', (0, auth_1.auth)(['admin']), review_controller_1.reviewController.deleteReview);
exports.reviewRoutes = router;
