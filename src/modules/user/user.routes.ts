// import { Router } from 'express';
// import userController from './user.controller';
// import { auth } from 'src/middleware/auth';
// import validateRequest from 'src/utils/validateRequest';
// import { createUserDto, updateProfileDto, updateUserDto } from './user.dto';

// const userRoutes = Router();

// userRoutes.get('/profile', auth(), userController.profile);
// userRoutes.post(
//     '/create',
//     auth(['admin']),
//     validateRequest(createUserDto),
//     userController.createUser,
// );
// userRoutes.put('/profile', auth(), validateRequest(updateProfileDto), userController.updateProfile);
// userRoutes.put('/:id', auth(['admin']), validateRequest(updateUserDto), userController.updateUser);
// export default userRoutes;
// server/routes/user.routes.ts
import { Router } from 'express';
import userController from './user.controller';
import { auth } from 'src/middleware/auth';
import validateRequest from 'src/utils/validateRequest';
import { createUserDto, updateProfileDto, updateUserDto, resetPasswordDto } from './user.dto';

const userRoutes = Router();

// Profile routes (authenticated users)
userRoutes.get('/profile', auth(), userController.profile);
userRoutes.put('/profile', auth(), validateRequest(updateProfileDto), userController.updateProfile);

// Admin-only user management routes
userRoutes.get('/', auth(['admin']), userController.getAllUsers);
userRoutes.get('/stats', auth(['admin']), userController.getUserStats);
userRoutes.get('/:id', auth(['admin']), userController.getUserById);
userRoutes.post('/', auth(['admin']), validateRequest(createUserDto), userController.createUser);
userRoutes.put('/:id', auth(['admin']), validateRequest(updateUserDto), userController.updateUser);
userRoutes.delete('/:id', auth(['admin']), userController.deleteUser);
userRoutes.put('/:id/status', auth(['admin']), userController.updateUserStatus);
userRoutes.put(
    '/:id/reset-password',
    auth(['admin']),
    validateRequest(resetPasswordDto),
    userController.resetUserPassword,
);

export default userRoutes;
