"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: false,
        unique: true,
        sparse: true, // Allows multiple null values
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        required: false,
        unique: true,
        sparse: true, // Allows multiple null values
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        default: 'student',
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active',
    },
    // Multiple batches
    batchNumbers: [
        {
            type: String,
            default: [],
        },
    ],
    batchIds: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'CourseBatch',
            default: [],
        },
    ],
    admissionIds: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Admission',
            default: [],
        },
    ],
    currentBatchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'CourseBatch',
    },
    currentBatchNumber: {
        type: String,
    },
}, {
    timestamps: true,
});
// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcrypt_1.default.genSalt(10);
        this.password = await bcrypt_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Add password validation method
userSchema.methods.validatePassword = async function (password) {
    try {
        return await bcrypt_1.default.compare(password, this.password);
    }
    catch (error) {
        return false;
    }
};
exports.User = mongoose_1.models.User || (0, mongoose_1.model)('User', userSchema);
exports.default = exports.User;
