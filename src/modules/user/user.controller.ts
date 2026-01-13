// server/controllers/user.controller.ts
import type { Request, Response } from 'express';
import catchAsync from 'src/utils/catchAsync';
import sendResponse from 'src/utils/sendResponse';
import type { IUser } from './user.interface';
import userService from './user.service';

// Existing methods
const profile = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const result = await userService.findUserById(user._id.toString());
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'User profile fetched successfully',
        data: result,
    });
});

const createUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await userService.createUser(req.body);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'User created successfully',
        data: result,
    });
});

const updateUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    const result = await userService.updateUser(userId, req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'User updated successfully',
        data: result,
    });
});

const updateProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const result = await userService.updateUser(user._id.toString(), req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'User profile updated successfully',
        data: result,
    });
});

// New methods for user management
const getAllUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { role } = req.query;
    const result = await userService.getAllUsers(role as string);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Users fetched successfully',
        data: result,
    });
});

const getUserById = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const result = await userService.getUserById(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'User fetched successfully',
        data: result,
    });
});

const deleteUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await userService.deleteUser(id);
});

const updateUserStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive', 'banned'].includes(status)) {
        return;
    }

    const result = await userService.updateUserStatus(id, status);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: `User ${status} successfully`,
        data: result,
    });
});

const resetUserPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { password } = req.body;

    await userService.resetUserPassword(id, password);
});

const getUserStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await userService.getUserStats();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'User statistics fetched successfully',
        data: result,
    });
});

const getMyBatches = catchAsync(async (req, res) => {
    // console.log('=== getMyBatches Controller ===');
    // console.log('Request user:', req.user);
    // console.log('User type:', typeof req.user);
    // console.log('User keys:', Object.keys(req.user || {}));

    const user = req.user as IUser;

    // Log all user properties
    // console.log('User properties:');
    for (const key in user) {
        // console.log(`${key}:`, (user as any)[key]);
    }

    // console.log('BatchId exists:', !!user.batchId);
    // console.log('BatchId type:', typeof user.batchId);
    // console.log('BatchId value:', user.batchId);

    // console.log('BatchNumber exists:', !!user.batchNumber);
    // console.log('BatchNumber value:', user.batchNumber);

    // console.log('AdmissionId exists:', !!user.admissionId);
    // console.log('AdmissionId value:', user.admissionId);

    interface Batch {
        _id: string;
        batchNumber: string;
        name: string;
        isActive: boolean;
        admissionId?: string;
    }

    let batches: Batch[] = [];

    if (user.role === 'student') {
        // console.log('User is student, checking batch info...');

        if (!user.batchId || !user.admissionId || !user.batchNumber) {
            // console.log('Missing batch info:', {
            //     hasBatchId: !!user.batchId,
            //     hasAdmissionId: !!user.admissionId,
            //     hasBatchNumber: !!user.batchNumber,
            // });
            // Instead of throwing, return empty array
            // console.log('Returning empty batches array');
        } else {
            // console.log('Creating batch object...');
            batches = [
                {
                    _id: user.batchId.toString(),
                    batchNumber: user.batchNumber,
                    name: `Batch ${user.batchNumber}`,
                    isActive: user.status === 'active',
                    admissionId: user.admissionId?.toString(),
                },
            ];
        }
    } else if (user.role === 'teacher') {
        // console.log('User is teacher, returning empty batches');
        batches = [];
    }

    // console.log('Returning batches:', batches);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Batches fetched successfully',
        data: { batches },
    });
});

const userController = {
    // Existing methods
    profile,
    createUser,
    updateUser,
    updateProfile,

    // New methods
    getAllUsers,
    getUserById,
    deleteUser,
    updateUserStatus,
    resetUserPassword,
    getUserStats,
    getMyBatches,
};

export default userController;
