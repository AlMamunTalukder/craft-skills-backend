"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const auth_service_1 = __importDefault(require("./auth.service"));
const passport_1 = __importDefault(require("../../config/passport"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const phoneSanitizer_1 = require("../../utils/phoneSanitizer");
const register = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.default.register(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: 'User registered successfully',
        data: result,
    });
});
const login = (0, catchAsync_1.default)((req, res, next) => {
    console.log('🔐 ===== LOGIN ATTEMPT =====');
    console.log('   Identifier:', req.body.identifier);
    console.log('   Website:', req.body.website);
    console.log('   Password provided:', !!req.body.password);
    // Sanitize identifier if it looks like a phone number
    let identifier = req.body.identifier;
    const isEmail = identifier.includes('@');
    if (!isEmail) {
        const sanitizedPhone = (0, phoneSanitizer_1.sanitizePhoneNumber)(identifier);
        if (sanitizedPhone) {
            req.body.identifier = sanitizedPhone;
        }
    }
    passport_1.default.authenticate('local', (err, user, info) => {
        if (err)
            return next(err);
        if (!user) {
            return (0, sendResponse_1.default)(res, {
                statusCode: 401,
                success: false,
                message: info?.message || 'Login failed',
                data: null,
            });
        }
        req.logIn(user, async (err) => {
            if (err)
                return next(err);
            // FORCE SESSION SAVE
            req.session.save((saveErr) => {
                if (saveErr) {
                    return next(saveErr);
                }
                const userData = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    batchNumbers: user.batchNumbers || [],
                    batchIds: user.batchIds || [],
                    currentBatchId: user.currentBatchId,
                    currentBatchNumber: user.currentBatchNumber,
                    admissionIds: user.admissionIds || [],
                };
                return (0, sendResponse_1.default)(res, {
                    statusCode: 200,
                    success: true,
                    message: 'Login successful',
                    data: userData,
                });
            });
        });
    })(req, res, next);
});
const logout = (0, catchAsync_1.default)(async (req, res) => {
    // Passport logout
    await new Promise((resolve, reject) => {
        req.logout((err) => {
            if (err)
                return reject(err);
            resolve();
        });
    });
    // Destroy session
    await new Promise((resolve, reject) => {
        req.session.destroy((err) => {
            if (err)
                return reject(err);
            resolve();
        });
    });
    res.clearCookie('craftskills.session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.craftskillsbd.com' : undefined,
        path: '/',
    });
    // ✅ ALWAYS RETURN JSON (CRITICAL)
    return res.status(200).json({
        success: true,
        message: 'Logout successful',
        data: null,
    });
});
const authController = {
    register,
    login,
    logout,
};
exports.default = authController;
