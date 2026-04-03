// auth.service.ts
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer'; 
import AppError from 'src/errors/AppError';
import type { IRegisterDto } from './auth.dto';
import httpStatus from 'http-status';
import type { IUser } from '../user/user.interface';
import { CourseBatch } from '../coursebatch/coursebatch.model';
import { IUserRole } from '../user/user.interface';
import User from '../user/user.model';
import { Admission } from '../admission/admission.model';


const register = async (data: IRegisterDto): Promise<IUser> => {

    // 1. Check if batch exists
    const batch = await CourseBatch.findOne({
        $or: [{ code: data.batchNumber }, { name: data.batchNumber }],
    });

    if (!batch) {
        throw new AppError(httpStatus.BAD_REQUEST, `Batch "${data.batchNumber}" not found.`);
    }

    // 2. Sanitize phone number if provided
    let sanitizedPhone = data.phone;
    if (sanitizedPhone && sanitizedPhone.trim() !== '') {
        const sanitized = sanitizePhoneNumber(sanitizedPhone);
        if (!sanitized) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'Invalid phone number format. Please enter a valid Bangladesh phone number.'
            );
        }
        sanitizedPhone = sanitized;
    }

    // 3. Check if student has admission in this batch
    let hasAdmission = false;
    let admissionInfo = null;

    // Check by email first
    if (data.email && data.email.trim() !== '') {
        const email = data.email.toLowerCase().trim();
        admissionInfo = await Admission.findOne({
            email: email,
            batchId: batch._id,
        });
        hasAdmission = !!admissionInfo;
    }

    // Check by sanitized phone if not found by email
    if (sanitizedPhone && sanitizedPhone.trim() !== '' && !hasAdmission) {
        admissionInfo = await Admission.findOne({
            phone: sanitizedPhone,
            batchId: batch._id,
        });
        hasAdmission = !!admissionInfo;
        
        // If still not found, try with original phone format (in case admission has different format)
        if (!hasAdmission && data.phone && data.phone !== sanitizedPhone) {
            admissionInfo = await Admission.findOne({
                phone: data.phone,
                batchId: batch._id,
            });
            hasAdmission = !!admissionInfo;
        }
    }

    if (!hasAdmission) {
        const identifier = data.email || sanitizedPhone || data.phone;
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `No admission found for ${identifier} in batch ${data.batchNumber}. Please check your information or contact support.`,
        );
    }

    // 4. Check if user already exists
    let existingUser = null;

    if (data.email && data.email.trim() !== '') {
        existingUser = await User.findOne({
            email: data.email.toLowerCase().trim(),
        });
    } else if (sanitizedPhone && sanitizedPhone.trim() !== '') {
        existingUser = await User.findOne({
            phone: sanitizedPhone,
        });
    }

    // 5. If user exists, add new batch to existing account
    if (existingUser) {
        // Check if user already has this batch
        if (existingUser.batchIds.includes(batch._id as any)) {
            throw new AppError(httpStatus.BAD_REQUEST, 'You are already enrolled in this batch.');
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
    const userData: any = {
        name: data.name,
        password: data.password,
        role: IUserRole._STUDENT,
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
        } else if (sanitizedPhone) {
            userData.phone = sanitizedPhone;
        }
    } else if (sanitizedPhone && sanitizedPhone.trim() !== '') {
        userData.phone = sanitizedPhone;
        if (admissionInfo.email) {
            userData.email = admissionInfo.email;
        }
    }

    try {
        return await User.create(userData);
    } catch (error: any) {
        // Handle duplicate key errors
        if (error.code === 11000) {
            if (error.keyPattern?.email) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    'Email already registered. Please log in instead.',
                );
            }
            if (error.keyPattern?.phone) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    'Phone already registered. Please log in instead.',
                );
            }
        }
        throw error;
    }
};


export default { register };



// // auth.service.ts - ROLE-BASED UNIQUENESS
// import AppError from 'src/errors/AppError';
// import userService from '../user/user.service';
// import type { IRegisterDto } from './auth.dto';
// import httpStatus from 'http-status';
// import type { IUser } from '../user/user.interface';
// import { CourseBatch } from '../coursebatch/coursebatch.model';
// import { IUserRole } from '../user/user.interface';
// import User from '../user/user.model';
// import { Admission } from '../admission/admission.model';

// const register = async (data: IRegisterDto): Promise<IUser> => {
//     // 1. Check if batch exists
//     const batch = await CourseBatch.findOne({
//         $or: [{ code: data.batchNumber }, { name: data.batchNumber }],
//     });

//     if (!batch) {
//         throw new AppError(httpStatus.BAD_REQUEST, `Batch "${data.batchNumber}" not found.`);
//     }

//     // 2. Check if student has admission in this batch
//     let hasAdmission = false;
//     let admissionInfo = null;

//     if (data.email && data.email.trim() !== '') {
//         const email = data.email.toLowerCase().trim();
//         admissionInfo = await Admission.findOne({
//             email: email,
//             batchId: batch._id,
//         });
//         hasAdmission = !!admissionInfo;
//     }

//     if (data.phone && data.phone.trim() !== '') {
//         const phone = data.phone.trim();
//         if (!hasAdmission) {
//             admissionInfo = await Admission.findOne({
//                 phone: phone,
//                 batchId: batch._id,
//             });
//             hasAdmission = !!admissionInfo;
//         }
//     }

//     if (!hasAdmission) {
//         const identifier = data.email || data.phone;
//         throw new AppError(
//             httpStatus.BAD_REQUEST,
//             `No admission found for ${identifier} in batch ${data.batchNumber}.`,
//         );
//     }

//     // 3. Check if user already exists (with same email/phone)
//     let existingUser = null;

//     if (data.email && data.email.trim() !== '') {
//         existingUser = await User.findOne({
//             email: data.email.toLowerCase().trim(),
//         });
//     } else if (data.phone && data.phone.trim() !== '') {
//         existingUser = await User.findOne({
//             phone: data.phone.trim(),
//         });
//     }

//     // 4. If user exists, add new batch to existing account
//     if (existingUser) {
//         // Check if user already has this batch
//         if (existingUser.batchIds.includes(batch._id as any)) {
//             throw new AppError(httpStatus.BAD_REQUEST, 'You are already enrolled in this batch.');
//         }

//         // Update existing user with new batch
//         existingUser.batchIds.push(batch._id);
//         existingUser.batchNumbers.push(data.batchNumber);
//         existingUser.admissionIds.push(admissionInfo._id);

//         // If this is the first batch, set as current
//         if (!existingUser.currentBatchId) {
//             existingUser.currentBatchId = batch._id;
//             existingUser.currentBatchNumber = data.batchNumber;
//         }

//         await existingUser.save();
//         return existingUser;
//     }

//     // 5. Create new user with first batch
//     const userData: any = {
//         name: data.name,
//         password: data.password,
//         role: IUserRole._STUDENT,
//         batchNumbers: [data.batchNumber],
//         batchIds: [batch._id],
//         admissionIds: [admissionInfo._id],
//         currentBatchId: batch._id,
//         currentBatchNumber: data.batchNumber,
//     };

//     if (data.email && data.email.trim() !== '') {
//         userData.email = data.email.toLowerCase().trim();
//         if (admissionInfo.phone) {
//             userData.phone = admissionInfo.phone;
//         }
//     } else if (data.phone && data.phone.trim() !== '') {
//         userData.phone = data.phone.trim();
//         if (admissionInfo.email) {
//             userData.email = admissionInfo.email;
//         }
//     }

//     try {
//         return await User.create(userData);
//     } catch (error: any) {
//         // Handle duplicate key errors
//         if (error.code === 11000) {
//             if (error.keyPattern?.email) {
//                 throw new AppError(
//                     httpStatus.BAD_REQUEST,
//                     'Email already registered. Please log in instead.',
//                 );
//             }
//             if (error.keyPattern?.phone) {
//                 throw new AppError(
//                     httpStatus.BAD_REQUEST,
//                     'Phone already registered. Please log in instead.',
//                 );
//             }
//         }
//         throw error;
//     }
// };



// export default { register };
