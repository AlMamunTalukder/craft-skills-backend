// server/routes/coupon.routes.ts
import { Router } from 'express';
import { couponController } from './coupon.controller';
import validateRequest from 'src/utils/validateRequest';
import { createCouponDto, updateCouponDto } from './coupon.dto';

const router = Router();

// Public routes
router.get('/code/:code', couponController.getCouponByCode);
router.post('/apply', couponController.applyCoupon);

// Protected routes (admin only)
router.get('/', couponController.getAllCoupons);
router.get('/:id', couponController.getCouponById);
router.post('/', validateRequest(createCouponDto), couponController.createCoupon);
router.put('/:id', validateRequest(updateCouponDto), couponController.updateCoupon);
router.put('/:id/status', couponController.updateCouponStatus);
router.delete('/:id', couponController.deleteCoupon);

export const couponRoutes = router;
