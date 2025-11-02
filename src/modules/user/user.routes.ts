import { Router } from 'express';
import userController from './user.controller';
import { auth } from 'src/middleware/auth';
import validateRequest from 'src/utils/validateRequest';
import { createUserDto, updateProfileDto, updateUserDto } from './user.dto';

const userRoutes = Router();

userRoutes.get('/profile', auth(), userController.profile);
userRoutes.post(
    '/create',
    auth(['admin']),
    validateRequest(createUserDto),
    userController.createUser,
);
userRoutes.put('/profile', auth(), validateRequest(updateProfileDto), userController.updateProfile);
userRoutes.put('/:id', auth(['admin']), validateRequest(updateUserDto), userController.updateUser);
export default userRoutes;
