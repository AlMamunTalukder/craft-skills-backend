"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("./user.model"));
const user_interface_1 = require("./user.interface");
// Your existing methods
const findUserById = async (id) => {
    return await user_model_1.default.findById(id).select('-password');
};
const findUserByEmail = async (email) => {
    return await user_model_1.default.findOne({ email }).select('-password');
};
const findUserByPhone = async (phone) => {
    return await user_model_1.default.findOne({ phone }).select('-password');
};
const findUserByEmailOrPhone = async (identifier) => {
    return await user_model_1.default.findOne({
        $or: [{ email: identifier }, { phone: identifier }],
    });
};
const createUser = async (data) => {
    // Default role to student if not provided
    const role = data.role || user_interface_1.IUserRole._STUDENT;
    // Prepare user data
    const userData = {
        ...data,
        role,
        status: data.status || user_interface_1.IUserStatus._ACTIVE,
    };
    // Ensure name exists
    if (!userData.name)
        throw new Error('Name is required');
    // Optional fields
    if (!userData.email)
        userData.email = undefined;
    if (!userData.phone)
        userData.phone = undefined;
    // TEACHER SPECIAL HANDLING
    if (role === user_interface_1.IUserRole._TEACHER) {
        // Use `validateBeforeSave: false` to skip Mongoose required validation
        const teacher = new user_model_1.default(userData);
        return await teacher.save({ validateBeforeSave: false });
    }
    // For students/admins, enforce required fields
    if (!userData.batchNumber)
        throw new Error('batchNumber is required for students/admins');
    if (!userData.batchId)
        throw new Error('batchId is required for students/admins');
    if (!userData.admissionId)
        throw new Error('admissionId is required for students/admins');
    return await user_model_1.default.create(userData);
};
const updateUser = async (id, data) => {
    return await user_model_1.default.findByIdAndUpdate(id, data, { new: true }).select('-password');
};
// New methods for role-based user management
const getAllUsers = async (role) => {
    const filter = {};
    if (role) {
        filter.role = role;
    }
    const users = await user_model_1.default.find(filter).select('-password').sort({ createdAt: -1 }).lean();
    // Cast to LeanUser type
    return users;
};
// Alias for findUserById to maintain consistency
const getUserById = async (id) => {
    return await findUserById(id);
};
const deleteUser = async (id) => {
    const user = await user_model_1.default.findByIdAndDelete(id);
    if (!user)
        throw new Error('User not found');
};
const updateUserStatus = async (id, status) => {
    return await user_model_1.default.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
};
const resetUserPassword = async (id, newPassword) => {
    const user = await user_model_1.default.findById(id);
    if (!user)
        throw new Error('User not found');
    // Set password - the pre-save hook will hash it
    user.password = newPassword;
    await user.save();
};
const getUserStats = async () => {
    const stats = await user_model_1.default.aggregate([
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 },
                active: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
                },
            },
        },
        {
            $project: {
                role: '$_id',
                count: 1,
                active: 1,
                inactive: { $subtract: ['$count', '$active'] },
            },
        },
        {
            $sort: { role: 1 },
        },
    ]);
    return stats;
};
const userService = {
    // Your existing methods
    findUserById,
    findUserByEmail,
    findUserByPhone,
    findUserByEmailOrPhone,
    createUser,
    updateUser,
    // New methods for user management
    getAllUsers,
    getUserById,
    deleteUser,
    updateUserStatus,
    resetUserPassword,
    getUserStats,
};
exports.default = userService;
