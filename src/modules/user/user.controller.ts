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

    // if (!result) {
    //     sendResponse(res, {
    //         statusCode: 404,
    //         success: false,
    //         message: 'User not found',
    //     });
    //     return;
    // }

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

    // sendResponse(res, {
    //     statusCode: 200,
    //     success: true,
    //     message: 'User deleted successfully',
    // });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive', 'banned'].includes(status)) {
        // sendResponse(res, {
        //     statusCode: 400,
        //     success: false,
        //     message: 'Invalid status value',
        // });
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
    // sendResponse(res, {
    //     statusCode: 200,
    //     success: true,
    //     message: 'Password reset successfully',
    // });
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
};

export default userController;
