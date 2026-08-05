"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const user_service_1 = __importDefault(require("./user.service"));
const user_model_1 = __importDefault(require("./user.model"));
const coursebatch_model_1 = require("../coursebatch/coursebatch.model");
// Existing methods
const profile = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const result = await user_service_1.default.findUserById(user._id.toString());
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User profile fetched successfully',
        data: result,
    });
});
const createUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.default.createUser(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: 'User created successfully',
        data: result,
    });
});
const updateUser = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.params.id;
    const result = await user_service_1.default.updateUser(userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User updated successfully',
        data: result,
    });
});
const updateProfile = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const result = await user_service_1.default.updateUser(user._id.toString(), req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User profile updated successfully',
        data: result,
    });
});
// New methods for user management
const getAllUsers = (0, catchAsync_1.default)(async (req, res) => {
    const { role } = req.query;
    const result = await user_service_1.default.getAllUsers(role);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Users fetched successfully',
        data: result,
    });
});
const getUserById = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const result = await user_service_1.default.getUserById(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User fetched successfully',
        data: result,
    });
});
const deleteUser = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    await user_service_1.default.deleteUser(id);
});
const updateUserStatus = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;
    if (!status || !['active', 'inactive', 'banned'].includes(status)) {
        return;
    }
    const result = await user_service_1.default.updateUserStatus(id, status);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: `User ${status} successfully`,
        data: result,
    });
});
const resetUserPassword = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const { password } = req.body;
    await user_service_1.default.resetUserPassword(id, password);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Password reset successfully',
        data: null,
    });
});
const getUserStats = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.default.getUserStats();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User statistics fetched successfully',
        data: result,
    });
});
// server/modules/user/user.controller.ts
const getMyBatches = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    let batches = [];
    if (user.role === 'student') {
        // Use the new schema arrays
        if (user.batchIds && user.batchIds.length > 0) {
            // Populate batch details
            const populatedBatches = await coursebatch_model_1.CourseBatch.find({
                _id: { $in: user.batchIds },
            }).select('_id code name isActive description');
            batches = user.batchIds
                .map((batchId, index) => {
                const batch = populatedBatches.find((b) => b._id.equals(batchId));
                if (batch) {
                    return {
                        _id: batch._id.toString(),
                        batchNumber: user.batchNumbers?.[index] || batch.code,
                        name: batch.name || `Batch ${batch.code}`,
                        description: batch.description || '',
                        isActive: batch.isActive,
                        admissionId: user.admissionIds?.[index]?.toString(),
                    };
                }
                return null;
            })
                .filter((batch) => batch !== null);
        }
        else {
            // No batches found
            batches = [];
        }
    }
    else if (user.role === 'teacher' || user.role === 'admin') {
        batches = [];
    }
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Batches fetched successfully',
        data: {
            batches,
            currentBatch: {
                currentBatchId: user.currentBatchId,
                currentBatchNumber: user.currentBatchNumber,
            },
        },
    });
});
// Add to user.controller.ts
const getMyProfile = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    // Return user data without password
    const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        batchNumbers: user.batchNumbers || [],
        currentBatchId: user.currentBatchId,
        currentBatchNumber: user.currentBatchNumber,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Profile fetched successfully',
        data: userData,
    });
});
const switchBatch = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { batchNumber } = req.body;
    // Find the batch
    const batch = await coursebatch_model_1.CourseBatch.findOne({
        $or: [{ code: batchNumber }, { name: batchNumber }],
    });
    if (!batch) {
        return (0, sendResponse_1.default)(res, {
            statusCode: 404,
            success: false,
            message: 'Batch not found',
            data: null,
        });
    }
    // Check if user is enrolled in this batch
    if (!user.batchIds.includes(batch._id)) {
        return (0, sendResponse_1.default)(res, {
            statusCode: 403,
            success: false,
            message: 'You are not enrolled in this batch',
            data: null,
        });
    }
    // Update user's current batch
    const updatedUser = await user_model_1.default.findByIdAndUpdate(user._id, {
        currentBatchId: batch._id,
        currentBatchNumber: batch.code,
    }, { new: true });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Batch switched successfully',
        data: {
            currentBatchId: batch._id,
            currentBatchNumber: batch.code,
            batchName: batch.name,
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                currentBatchId: updatedUser.currentBatchId,
                currentBatchNumber: updatedUser.currentBatchNumber,
            },
        },
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
    getMyProfile,
    switchBatch,
};
exports.default = userController;
