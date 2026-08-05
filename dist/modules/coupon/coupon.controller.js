"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponController = void 0;
const coupon_service_1 = require("./coupon.service");
exports.couponController = {
    // Get all coupons
    getAllCoupons: async (req, res) => {
        try {
            const coupons = await coupon_service_1.couponService.getAllCoupons();
            res.json({ success: true, data: coupons });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch coupons',
            });
        }
    },
    // Get coupon by ID
    getCouponById: async (req, res) => {
        try {
            const id = req.params.id;
            const coupon = await coupon_service_1.couponService.getCouponById(id);
            res.json({ success: true, data: coupon });
        }
        catch (error) {
            const status = error instanceof Error && error.message === 'Coupon not found' ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch coupon',
            });
        }
    },
    // Get coupon by code (public endpoint)
    getCouponByCode: async (req, res) => {
        try {
            const code = req.params.code;
            const coupon = await coupon_service_1.couponService.getCouponByCode(code);
            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Coupon not found',
                });
            }
            res.json({ success: true, data: coupon });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch coupon',
            });
        }
    },
    // Create coupon
    createCoupon: async (req, res) => {
        try {
            const createDto = req.body;
            const coupon = await coupon_service_1.couponService.createCoupon(createDto);
            res.status(201).json({ success: true, data: coupon });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create coupon',
            });
        }
    },
    // Update coupon
    updateCoupon: async (req, res) => {
        try {
            const id = req.params.id;
            const updateDto = req.body;
            const coupon = await coupon_service_1.couponService.updateCoupon(id, updateDto);
            res.json({ success: true, data: coupon });
        }
        catch (error) {
            const status = error instanceof Error && error.message === 'Coupon not found' ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update coupon',
            });
        }
    },
    // Delete coupon
    deleteCoupon: async (req, res) => {
        try {
            const id = req.params.id;
            await coupon_service_1.couponService.deleteCoupon(id);
            res.json({ success: true, message: 'Coupon deleted successfully' });
        }
        catch (error) {
            const status = error instanceof Error && error.message === 'Coupon not found' ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to delete coupon',
            });
        }
    },
    // Update coupon status
    updateCouponStatus: async (req, res) => {
        try {
            const id = req.params.id;
            const { isActive } = req.body;
            if (typeof isActive !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'isActive must be a boolean',
                });
            }
            const coupon = await coupon_service_1.couponService.updateCouponStatus(id, isActive);
            res.json({ success: true, data: coupon });
        }
        catch (error) {
            const status = error instanceof Error && error.message === 'Coupon not found' ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update coupon status',
            });
        }
    },
    // Apply coupon (public endpoint)
    applyCoupon: async (req, res) => {
        try {
            const { code, totalAmount } = req.body;
            if (!code || typeof totalAmount !== 'number' || totalAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid code and totalAmount are required',
                });
            }
            const result = await coupon_service_1.couponService.applyCoupon(code, totalAmount);
            res.json({ success: result.isValid, ...result });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to apply coupon',
            });
        }
    },
};
