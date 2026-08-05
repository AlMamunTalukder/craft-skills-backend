"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// auth.service.ts
const phoneSanitizer_1 = require("../../utils/phoneSanitizer");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const coursebatch_model_1 = require("../coursebatch/coursebatch.model");
const user_interface_1 = require("../user/user.interface");
const user_model_1 = __importDefault(require("../user/user.model"));
const admission_model_1 = require("../admission/admission.model");
const register = async (data) => {
    // 1. Check if batch exists
    const batch = await coursebatch_model_1.CourseBatch.findOne({
        $or: [{ code: data.batchNumber }, { name: data.batchNumber }],
    });
    if (!batch) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Batch "${data.batchNumber}" not found.`);
    }
    // 2. Sanitize phone number if provided
    let sanitizedPhone = data.phone;
    if (sanitizedPhone && sanitizedPhone.trim() !== '') {
        const sanitized = (0, phoneSanitizer_1.sanitizePhoneNumber)(sanitizedPhone);
        if (!sanitized) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid phone number format. Please enter a valid Bangladesh phone number.');
        }
        sanitizedPhone = sanitized;
    }
    // 3. Check if student has admission in this batch
    let hasAdmission = false;
    let admissionInfo = null;
    // Check by email first
    if (data.email && data.email.trim() !== '') {
        const email = data.email.toLowerCase().trim();
        admissionInfo = await admission_model_1.Admission.findOne({
            email: email,
            batchId: batch._id,
        });
        hasAdmission = !!admissionInfo;
    }
    // Check by sanitized phone if not found by email
    if (sanitizedPhone && sanitizedPhone.trim() !== '' && !hasAdmission) {
        admissionInfo = await admission_model_1.Admission.findOne({
            phone: sanitizedPhone,
            batchId: batch._id,
        });
        hasAdmission = !!admissionInfo;
        // If still not found, try with original phone format (in case admission has different format)
        if (!hasAdmission && data.phone && data.phone !== sanitizedPhone) {
            admissionInfo = await admission_model_1.Admission.findOne({
                phone: data.phone,
                batchId: batch._id,
            });
            hasAdmission = !!admissionInfo;
        }
    }
    if (!hasAdmission) {
        const identifier = data.email || sanitizedPhone || data.phone;
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `No admission found for ${identifier} in batch ${data.batchNumber}. Please check your information or contact support.`);
    }
    // 4. Check if user already exists
    let existingUser = null;
    if (data.email && data.email.trim() !== '') {
        existingUser = await user_model_1.default.findOne({
            email: data.email.toLowerCase().trim(),
        });
    }
    else if (sanitizedPhone && sanitizedPhone.trim() !== '') {
        existingUser = await user_model_1.default.findOne({
            phone: sanitizedPhone,
        });
    }
    // 5. If user exists, add new batch to existing account
    if (existingUser) {
        // Check if user already has this batch
        if (existingUser.batchIds.includes(batch._id)) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'You are already enrolled in this batch.');
        }
        // Update existing user with new batch
        existingUser.batchIds.push(batch._id);
        existingUser.batchNumbers.push(data.batchNumber);
        existingUser.admissionIds.push(admissionInfo._id);
        // If this is the first batch, set as current
        if (!existingUser.currentBatchId) {
            existingUser.currentBatchId = batch._id;
            existingUser.currentBatchNumber = data.batchNumber;
        }
        await existingUser.save();
        return existingUser;
    }
    // 6. Create new user with first batch
    const userData = {
        name: data.name,
        password: data.password,
        role: user_interface_1.IUserRole._STUDENT,
        batchNumbers: [data.batchNumber],
        batchIds: [batch._id],
        admissionIds: [admissionInfo._id],
        currentBatchId: batch._id,
        currentBatchNumber: data.batchNumber,
    };
    // Set email and phone from admission if available
    if (data.email && data.email.trim() !== '') {
        userData.email = data.email.toLowerCase().trim();
        // Use phone from admission or sanitized phone
        if (admissionInfo.phone) {
            userData.phone = admissionInfo.phone;
        }
        else if (sanitizedPhone) {
            userData.phone = sanitizedPhone;
        }
    }
    else if (sanitizedPhone && sanitizedPhone.trim() !== '') {
        userData.phone = sanitizedPhone;
        if (admissionInfo.email) {
            userData.email = admissionInfo.email;
        }
    }
    try {
        return await user_model_1.default.create(userData);
    }
    catch (error) {
        // Handle duplicate key errors
        if (error.code === 11000) {
            if (error.keyPattern?.email) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Email already registered. Please log in instead.');
            }
            if (error.keyPattern?.phone) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Phone already registered. Please log in instead.');
            }
        }
        throw error;
    }
};
exports.default = { register };
