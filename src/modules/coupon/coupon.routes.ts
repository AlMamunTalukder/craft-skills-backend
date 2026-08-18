// server/routes/coupon.routes.ts
import { Router } from 'express';
import { couponController } from './coupon.controller';
import validateRequest from 'src/utils/validateRequest';
import { createCouponDto, updateCouponDto } from './coupon.dto';
import { auth } from 'src/middleware/auth';

const router = Router();

// Public routes
router.get('/code/:code', couponController.getCouponByCode);
router.post('/apply', couponController.applyCoupon);

// Admin-only routes
router.get('/', auth(['admin']), couponController.getAllCoupons);
router.get('/:id', auth(['admin']), couponController.getCouponById);
router.post('/', auth(['admin']), validateRequest(createCouponDto), couponController.createCoupon);
router.put('/:id', auth(['admin']), validateRequest(updateCouponDto), couponController.updateCoupon);
router.put('/:id/status', auth(['admin']), couponController.updateCouponStatus);
router.delete('/:id', auth(['admin']), couponController.deleteCoupon);

export const couponRoutes = router;
