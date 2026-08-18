"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponRoutes = void 0;
// server/routes/coupon.routes.ts
const express_1 = require("express");
const coupon_controller_1 = require("./coupon.controller");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const coupon_dto_1 = require("./coupon.dto");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/code/:code', coupon_controller_1.couponController.getCouponByCode);
router.post('/apply', coupon_controller_1.couponController.applyCoupon);
// Admin-only routes
router.get('/', (0, auth_1.auth)(['admin']), coupon_controller_1.couponController.getAllCoupons);
router.get('/:id', (0, auth_1.auth)(['admin']), coupon_controller_1.couponController.getCouponById);
router.post('/', (0, auth_1.auth)(['admin']), (0, validateRequest_1.default)(coupon_dto_1.createCouponDto), coupon_controller_1.couponController.createCoupon);
router.put('/:id', (0, auth_1.auth)(['admin']), (0, validateRequest_1.default)(coupon_dto_1.updateCouponDto), coupon_controller_1.couponController.updateCoupon);
router.put('/:id/status', (0, auth_1.auth)(['admin']), coupon_controller_1.couponController.updateCouponStatus);
router.delete('/:id', (0, auth_1.auth)(['admin']), coupon_controller_1.couponController.deleteCoupon);
exports.couponRoutes = router;
