import type { Request, Response, NextFunction } from 'express';
import sendResponse from 'src/utils/sendResponse';
import authService from './auth.service';
import passport from 'src/config/passport';
import type { IUser } from '../user/user.interface';
import catchAsync from 'src/utils/catchAsync';

const register = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await authService.register(req.body);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'User registered successfully',
        data: result,
    });
});

const login = catchAsync((req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate('local', (err: any, user: IUser, info: any) => {
        if (err) return next(err);
        if (!user) {
            return sendResponse(res, {
                statusCode: 401,
                success: false,
                message: info?.message || 'Login failed',
                data: null,
            });
        }

        req.logIn(user, (err) => {
            if (err) return next(err);

            // Return user data with batches - USING NEW PROPERTIES ONLY
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                // Use only new properties (arrays)
                batchNumbers: user.batchNumbers || [],
                batchIds: user.batchIds || [],
                currentBatchId: user.currentBatchId,
                currentBatchNumber: user.currentBatchNumber,
                admissionIds: user.admissionIds || [],
            };

            return sendResponse(res, {
                statusCode: 200,
                success: true,
                message: 'Login successful',
                data: userData,
            });
        });
    })(req, res, next);
});

// const login = catchAsync((req: Request, res: Response, next: NextFunction): void => {
//     passport.authenticate('local', (err: any, user: IUser, info: any) => {
//         if (err) return next(err);
//         if (!user) {
//             return sendResponse(res, {
//                 statusCode: 401,
//                 success: false,
//                 message: info?.message || 'Login failed',
//                 data: null,
//             });
//         }

//         req.logIn(user, (err) => {
//             if (err) return next(err);
//             return sendResponse(res, {
//                 statusCode: 200,
//                 success: true,
//                 message: 'Login successful',
//                 data: { id: user.id, email: user.email },
//             });
//         });
//     })(req, res, next);
// });

// const logout = catchAsync((req: Request, res: Response, next: NextFunction) => {
//     req.logout((err) => {
//         if (err) return next(err);

//         req.session.destroy(function (err) {
//             if (err) {
//                 return next(err);
//             }
//             res.clearCookie('connect.sid');
//             res.redirect('/');
//         });
//     });
// });

const logout = catchAsync(async (req: Request, res: Response) => {
    // Passport logout
    await new Promise<void>((resolve, reject) => {
        req.logout((err) => {
            if (err) return reject(err);
            resolve();
        });
    });

    // Destroy session
    await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => {
            if (err) return reject(err);
            resolve();
        });
    });

    // Clear cookie (IMPORTANT: must match your session config)
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

export default authController;
