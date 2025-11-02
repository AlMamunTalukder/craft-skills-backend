import type { Request, Response } from 'express';
import catchAsync from 'src/utils/catchAsync';
import sendResponse from 'src/utils/sendResponse';
import type { IUser } from './user.interface';
import userService from './user.service';

const profile = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const result = await userService.findUserById(user._id);
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
    const result = await userService.updateUser(user._id, req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'User profile updated successfully',
        data: result,
    });
});

const userController = {
    profile,
    createUser,
    updateUser,
    updateProfile,
};

export default userController;
