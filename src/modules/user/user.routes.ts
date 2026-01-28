// // server/routes/user.routes.ts
// import { Router } from 'express';
// import userController from './user.controller';
// import { auth } from 'src/middleware/auth';
// import validateRequest from 'src/utils/validateRequest';
// import { createUserDto, updateProfileDto, updateUserDto, resetPasswordDto } from './user.dto';

// const userRoutes = Router();

// // Profile routes (authenticated users)
// userRoutes.get('/profile', auth(), userController.profile);
// userRoutes.put('/profile', auth(), validateRequest(updateProfileDto), userController.updateProfile);

// // Admin-only user management routes
// userRoutes.get('/', auth(['admin']), userController.getAllUsers);
// userRoutes.get('/stats', auth(['admin']), userController.getUserStats);
// userRoutes.get('/:id', auth(['admin']), userController.getUserById);
// userRoutes.post('/', auth(['admin']), validateRequest(createUserDto), userController.createUser);
// userRoutes.put('/:id', auth(['admin']), validateRequest(updateUserDto), userController.updateUser);
// userRoutes.delete('/:id', auth(['admin']), userController.deleteUser);
// userRoutes.put('/:id/status', auth(['admin']), userController.updateUserStatus);
// userRoutes.put(
//     '/:id/reset-password',
//     auth(['admin']),
//     validateRequest(resetPasswordDto),
//     userController.resetUserPassword,
// );
// userRoutes.get('/my-batches', auth(), userController.getMyBatches);

// export default userRoutes;

// server/routes/user.routes.ts
import { Router } from 'express';
import userController from './user.controller';
import { auth } from 'src/middleware/auth';
import validateRequest from 'src/utils/validateRequest';
import { createUserDto, updateProfileDto, updateUserDto, resetPasswordDto } from './user.dto';

const userRoutes = Router();

// ========== PUBLIC ROUTES (if any) ==========

// ========== AUTHENTICATED USER ROUTES ==========
userRoutes.get('/profile', auth(), userController.profile);
userRoutes.put('/profile', auth(), validateRequest(updateProfileDto), userController.updateProfile);

// ========== STUDENT-SPECIFIC ROUTES ==========
// MUST COME BEFORE /:id routes!
userRoutes.get('/my-batches', auth(), userController.getMyBatches);
userRoutes.get('/my-profile', auth(), userController.getMyProfile);
userRoutes.post('/switch-batch', auth(), userController.switchBatch);

// ========== ADMIN-ONLY ROUTES ==========
userRoutes.get('/', auth(['admin']), userController.getAllUsers);
userRoutes.get('/stats', auth(['admin']), userController.getUserStats);

// ========== PARAMETERIZED ROUTES (MUST COME LAST) ==========
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
