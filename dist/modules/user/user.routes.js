"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/routes/user.routes.ts
const express_1 = require("express");
const user_controller_1 = __importDefault(require("./user.controller"));
const auth_1 = require("../../middleware/auth");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const user_dto_1 = require("./user.dto");
const userRoutes = (0, express_1.Router)();
// ========== PUBLIC ROUTES (if any) ==========
// ========== AUTHENTICATED USER ROUTES ==========
userRoutes.get('/profile', (0, auth_1.auth)(), user_controller_1.default.profile);
userRoutes.put('/profile', (0, auth_1.auth)(), (0, validateRequest_1.default)(user_dto_1.updateProfileDto), user_controller_1.default.updateProfile);
// ========== STUDENT-SPECIFIC ROUTES ==========
// MUST COME BEFORE /:id routes!
userRoutes.get('/my-batches', (0, auth_1.auth)(), user_controller_1.default.getMyBatches);
userRoutes.get('/my-profile', (0, auth_1.auth)(), user_controller_1.default.getMyProfile);
userRoutes.post('/switch-batch', (0, auth_1.auth)(), user_controller_1.default.switchBatch);
// ========== ADMIN-ONLY ROUTES ==========
userRoutes.get('/', (0, auth_1.auth)(['admin']), user_controller_1.default.getAllUsers);
userRoutes.get('/stats', (0, auth_1.auth)(['admin']), user_controller_1.default.getUserStats);
// ========== PARAMETERIZED ROUTES (MUST COME LAST) ==========
userRoutes.get('/:id', (0, auth_1.auth)(['admin']), user_controller_1.default.getUserById);
userRoutes.post('/', (0, auth_1.auth)(['admin']), (0, validateRequest_1.default)(user_dto_1.createUserDto), user_controller_1.default.createUser);
userRoutes.put('/:id', (0, auth_1.auth)(['admin']), (0, validateRequest_1.default)(user_dto_1.updateUserDto), user_controller_1.default.updateUser);
userRoutes.delete('/:id', (0, auth_1.auth)(['admin']), user_controller_1.default.deleteUser);
userRoutes.put('/:id/status', (0, auth_1.auth)(['admin']), user_controller_1.default.updateUserStatus);
userRoutes.put('/:id/reset-password', (0, auth_1.auth)(['admin']), (0, validateRequest_1.default)(user_dto_1.resetPasswordDto), user_controller_1.default.resetUserPassword);
exports.default = userRoutes;
