// auth.service.ts - ROLE-BASED UNIQUENESS
import AppError from 'src/errors/AppError';
import userService from '../user/user.service';
import type { IRegisterDto } from './auth.dto';
import httpStatus from 'http-status';
import type { IUser } from '../user/user.interface';
import { CourseBatch } from '../coursebatch/coursebatch.model';
import { IUserRole } from '../user/user.interface';
import User from '../user/user.model';
import { Admission } from '../admission/admission.model';

const register = async (data: IRegisterDto): Promise<IUser> => {
    console.log('=== STUDENT REGISTRATION ===');

    // 1. Check if batch exists
    const batch = await CourseBatch.findOne({
        $or: [{ code: data.batchNumber }, { name: data.batchNumber }],
    });

    if (!batch) {
        throw new AppError(httpStatus.BAD_REQUEST, `Batch "${data.batchNumber}" not found.`);
    }

    // 2. Check if student has admission in this batch
    let hasAdmission = false;
    let admissionInfo = null;

    if (data.email && data.email.trim() !== '') {
        const email = data.email.toLowerCase().trim();
        admissionInfo = await Admission.findOne({
            email: email,
            batchId: batch._id,
        });
        hasAdmission = !!admissionInfo;
    }

    if (data.phone && data.phone.trim() !== '') {
        const phone = data.phone.trim();
        if (!hasAdmission) {
            admissionInfo = await Admission.findOne({
                phone: phone,
                batchId: batch._id,
            });
            hasAdmission = !!admissionInfo;
        }
    }

    if (!hasAdmission) {
        const identifier = data.email || data.phone;
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `No admission found for ${identifier} in batch ${data.batchNumber}.`,
        );
    }

    // 3. Check if student already exists (ROLE-SPECIFIC CHECK)
    let existingStudent = null;

    if (data.email && data.email.trim() !== '') {
        const email = data.email.toLowerCase().trim();

        // Check if email exists AS A STUDENT (not teacher/admin)
        existingStudent = await User.findOne({
            email: email,
            role: IUserRole._STUDENT, // Only check student role
        });

        console.log('Student check by email:', {
            email,
            found: !!existingStudent,
            role: existingStudent?.role,
        });
    }

    if (data.phone && data.phone.trim() !== '') {
        const phone = data.phone.trim();

        // Check if phone exists AS A STUDENT (not teacher/admin)
        existingStudent = await User.findOne({
            phone: phone,
            role: IUserRole._STUDENT, // Only check student role
        });

        console.log('Student check by phone:', {
            phone,
            found: !!existingStudent,
            role: existingStudent?.role,
        });
    }

    if (existingStudent) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Student account already exists. Please log in instead.',
        );
    }

    // 4. Check if email/phone exists as teacher/admin (ALLOWED - different role)
    let existingOtherRole = null;

    if (data.email && data.email.trim() !== '') {
        const email = data.email.toLowerCase().trim();
        existingOtherRole = await User.findOne({
            email: email,
            role: { $ne: IUserRole._STUDENT }, // Find if exists as teacher/admin
        });

        if (existingOtherRole) {
            console.log('Email exists as different role:', {
                email,
                existingRole: existingOtherRole.role,
                message: 'Allowed - different role',
            });
        }
    }

    if (data.phone && data.phone.trim() !== '') {
        const phone = data.phone.trim();
        existingOtherRole = await User.findOne({
            phone: phone,
            role: { $ne: IUserRole._STUDENT }, // Find if exists as teacher/admin
        });

        if (existingOtherRole) {
            console.log('Phone exists as different role:', {
                phone,
                existingRole: existingOtherRole.role,
                message: 'Allowed - different role',
            });
        }
    }

    // 5. Prepare student data
    const userData: any = {
        name: data.name,
        password: data.password,
        role: IUserRole._STUDENT, // Always student role for registration
        batchNumber: data.batchNumber,
        batchId: batch._id,
        admissionId: admissionInfo._id,
    };

    // 6. Set email or phone
    if (data.email && data.email.trim() !== '') {
        userData.email = data.email.toLowerCase().trim();
        // Optionally add phone from admission if available
        if (admissionInfo.phone) {
            userData.phone = admissionInfo.phone;
        }
    } else if (data.phone && data.phone.trim() !== '') {
        userData.phone = data.phone.trim();
        // Optionally add email from admission if available
        if (admissionInfo.email) {
            userData.email = admissionInfo.email;
        }
    }

    console.log('Creating student with data:', userData);

    // 7. Create student
    try {
        return await User.create(userData);
    } catch (error: any) {
        console.error('Create user error:', error);

        // Handle specific duplicate key errors
        if (error.code === 11000) {
            // Check which field caused duplicate
            if (error.keyPattern?.email && error.keyPattern?.role) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    'Email already registered as a student. Please use different email or log in.',
                );
            }
            if (error.keyPattern?.phone && error.keyPattern?.role) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    'Phone already registered as a student. Please use different phone or log in.',
                );
            }
        }
        throw error;
    }
};

export default { register };
