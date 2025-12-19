// server/controllers/coupon.controller.ts
import type { Request, Response } from 'express';
import { couponService } from './coupon.service';
import type { CreateCouponDto, UpdateCouponDto } from './coupon.dto';

export const couponController = {
    // Get all coupons
    getAllCoupons: async (req: Request, res: Response) => {
        try {
            const coupons = await couponService.getAllCoupons();
            res.json({ success: true, data: coupons });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch coupons',
            });
        }
    },

    // Get coupon by ID
    getCouponById: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const coupon = await couponService.getCouponById(id);
            res.json({ success: true, data: coupon });
        } catch (error) {
            const status =
                error instanceof Error && error.message === 'Coupon not found' ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch coupon',
            });
        }
    },

    // Get coupon by code (public endpoint)
    getCouponByCode: async (req: Request, res: Response) => {
        try {
            const { code } = req.params;
            const coupon = await couponService.getCouponByCode(code);

            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Coupon not found',
                });
            }

            res.json({ success: true, data: coupon });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch coupon',
            });
        }
    },

    // Create coupon
    createCoupon: async (req: Request, res: Response) => {
        try {
            const createDto: CreateCouponDto = req.body;
            const coupon = await couponService.createCoupon(createDto);
            res.status(201).json({ success: true, data: coupon });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create coupon',
            });
        }
    },

    // Update coupon
    updateCoupon: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const updateDto: UpdateCouponDto = req.body;
            const coupon = await couponService.updateCoupon(id, updateDto);
            res.json({ success: true, data: coupon });
        } catch (error) {
            const status =
                error instanceof Error && error.message === 'Coupon not found' ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update coupon',
            });
        }
    },

    // Delete coupon
    deleteCoupon: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await couponService.deleteCoupon(id);
            res.json({ success: true, message: 'Coupon deleted successfully' });
        } catch (error) {
            const status =
                error instanceof Error && error.message === 'Coupon not found' ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to delete coupon',
            });
        }
    },

    // Update coupon status
    updateCouponStatus: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { isActive } = req.body;

            if (typeof isActive !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'isActive must be a boolean',
                });
            }

            const coupon = await couponService.updateCouponStatus(id, isActive);
            res.json({ success: true, data: coupon });
        } catch (error) {
            const status =
                error instanceof Error && error.message === 'Coupon not found' ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update coupon status',
            });
        }
    },

    // Apply coupon (public endpoint)
    applyCoupon: async (req: Request, res: Response) => {
        try {
            const { code, totalAmount } = req.body;

            if (!code || typeof totalAmount !== 'number' || totalAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid code and totalAmount are required',
                });
            }

            const result = await couponService.applyCoupon(code, totalAmount);
            res.json({ success: result.isValid, ...result });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to apply coupon',
            });
        }
    },
};
