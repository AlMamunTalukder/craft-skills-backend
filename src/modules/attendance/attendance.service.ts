/* eslint-disable no-console */
// server/services/attendance.service.ts

import type { CreateAttendanceDto, UpdateAttendanceDto } from './attendance.dto';
import type { IAttendance } from './attendance.model';
import Attendance from './attendance.model';

// Define a lean version of IAttendance (without Mongoose Document methods)
type LeanAttendance = Omit<IAttendance, keyof Document> & {
    _id: string;
};

// Helper to generate classes based on counts
const generateClasses = (
    mainClasses: number,
    specialClasses: number,
    guestClasses: number,
): IAttendance[] => {
    const classes: IAttendance[] = [];

    // Generate main classes
    // for (let i = 1; i <= mainClasses; i++) {
    //     classes.push({
    //         className: `Main Class ${i}`,
    //         type: AttendanceType.MAIN,
    //         sessions: [
    //             {
    //                 type: AttendanceSessionType.MAIN_CLASS,
    //                 name: 'Main Class Session',
    //                 date: undefined,
    //                 attended: false,
    //             },
    //             {
    //                 type: AttendanceSessionType.PROBLEM_SOLVING,
    //                 name: 'Problem Solving Session',
    //                 date: undefined,
    //                 attended: false,
    //             },
    //             {
    //                 type: AttendanceSessionType.PRACTICE,
    //                 name: 'Practice Session',
    //                 date: undefined,
    //                 attended: false,
    //             },
    //         ],
    //     });
    // }

    // Generate special classes
    // for (let i = 1; i <= specialClasses; i++) {
    //     classes.push({
    //         className: `Special Class ${i}`,
    //         type: AttendanceType.SPECIAL,
    //         sessions: [
    //             {
    //                 type: AttendanceSessionType.MAIN_CLASS,
    //                 name: 'Special Class Session',
    //                 date: undefined,
    //                 attended: false,
    //             },
    //         ],
    //     });
    // }

    // Generate guest classes
    // for (let i = 1; i <= guestClasses; i++) {
    //     classes.push({
    //         className: `Guest Class ${i}`,
    //         type: AttendanceType.GUEST,
    //         guestName: `Guest Speaker ${i}`,
    //         sessions: [
    //             {
    //                 type: AttendanceSessionType.MAIN_CLASS,
    //                 name: 'Guest Lecture Session',
    //                 date: undefined,
    //                 attended: false,
    //             },
    //         ],
    //     });
    // }

    return classes;
};

// Get all attendance routines
const getAllAttendances = async (): Promise<LeanAttendance[]> => {
    try {
        const attendances = await Attendance.find().sort({ createdAt: -1 }).lean().exec();

        // Cast to LeanAttendance type
        return attendances as unknown as LeanAttendance[];
    } catch (error) {
        console.error('Error fetching attendances:', error);
        throw new Error('Failed to fetch attendance routines');
    }
};

// Get attendance by ID
const getAttendanceById = async (id: string): Promise<LeanAttendance | null> => {
    try {
        const attendance = await Attendance.findById(id).lean().exec();

        if (!attendance) {
            return null;
        }

        // Cast to LeanAttendance type
        return attendance as unknown as LeanAttendance;
    } catch (error) {
        console.error('Error fetching attendance by ID:', error);
        throw new Error('Failed to fetch attendance routine');
    }
};

// Create attendance routine
const createAttendance = async (data: CreateAttendanceDto): Promise<LeanAttendance> => {
    try {
        const { mainClasses, specialClasses, guestClasses, ...rest } = data;

        // Generate classes based on counts
        const classes = generateClasses(mainClasses, specialClasses, guestClasses);

        // Calculate total classes
        const totalClasses = mainClasses + specialClasses + guestClasses;

        const attendance = new Attendance({
            ...rest,
            classes,
            totalClasses,
            mainClasses,
            specialClasses,
            guestClasses,
        });

        const savedAttendance = await attendance.save();

        // Convert to plain object
        const attendanceObj = savedAttendance.toObject();

        // Cast to LeanAttendance type
        return attendanceObj as unknown as LeanAttendance;
    } catch (error) {
        console.error('Error creating attendance:', error);
        throw new Error('Failed to create attendance routine');
    }
};

// Update attendance routine
const updateAttendance = async (
    id: string,
    data: UpdateAttendanceDto,
): Promise<LeanAttendance | null> => {
    try {
        const attendance = await Attendance.findById(id).exec();

        if (!attendance) {
            throw new Error('Attendance not found');
        }

        let updateData: any = { ...data };
        // let classes: IAttendanceClass[] | undefined;
        let mainClasses: number;
        let specialClasses: number;
        let guestClasses: number;

        // If class counts are being updated, regenerate classes
        if (
            data.mainClasses !== undefined ||
            data.specialClasses !== undefined ||
            data.guestClasses !== undefined
        ) {
            mainClasses =
                data.mainClasses !== undefined ? data.mainClasses : attendance.mainClasses;
            specialClasses =
                data.specialClasses !== undefined ? data.specialClasses : attendance.specialClasses;
            guestClasses =
                data.guestClasses !== undefined ? data.guestClasses : attendance.guestClasses;

            // classes = generateClasses(mainClasses, specialClasses, guestClasses);

            updateData = {
                ...updateData,
                // classes,
                totalClasses: mainClasses + specialClasses + guestClasses,
                mainClasses,
                specialClasses,
                guestClasses,
            };
        }

        const updatedAttendance = await Attendance.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        })
            .lean()
            .exec();

        if (!updatedAttendance) {
            return null;
        }

        // Cast to LeanAttendance type
        return updatedAttendance as unknown as LeanAttendance;
    } catch (error) {
        console.error('Error updating attendance:', error);
        throw new Error('Failed to update attendance routine');
    }
};

// Delete attendance routine
const deleteAttendance = async (id: string): Promise<void> => {
    try {
        const attendance = await Attendance.findByIdAndDelete(id).exec();

        if (!attendance) {
            throw new Error('Attendance not found');
        }
    } catch (error) {
        console.error('Error deleting attendance:', error);
        throw new Error('Failed to delete attendance routine');
    }
};

// Update attendance status
const updateAttendanceStatus = async (
    id: string,
    isActive: boolean,
): Promise<LeanAttendance | null> => {
    try {
        const attendance = await Attendance.findByIdAndUpdate(id, { isActive }, { new: true })
            .lean()
            .exec();

        if (!attendance) {
            return null;
        }

        // Cast to LeanAttendance type
        return attendance as unknown as LeanAttendance;
    } catch (error) {
        console.error('Error updating attendance status:', error);
        throw new Error('Failed to update attendance status');
    }
};

// Get attendance statistics
const getAttendanceStats = async () => {
    try {
        const stats = await Attendance.aggregate([
            {
                $group: {
                    _id: null,
                    totalRoutines: { $sum: 1 },
                    activeRoutines: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
                    totalClasses: { $sum: '$totalClasses' },
                    totalMainClasses: { $sum: '$mainClasses' },
                    totalSpecialClasses: { $sum: '$specialClasses' },
                    totalGuestClasses: { $sum: '$guestClasses' },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalRoutines: 1,
                    activeRoutines: 1,
                    inactiveRoutines: { $subtract: ['$totalRoutines', '$activeRoutines'] },
                    totalClasses: 1,
                    totalMainClasses: 1,
                    totalSpecialClasses: 1,
                    totalGuestClasses: 1,
                },
            },
        ]);

        return (
            stats[0] || {
                totalRoutines: 0,
                activeRoutines: 0,
                inactiveRoutines: 0,
                totalClasses: 0,
                totalMainClasses: 0,
                totalSpecialClasses: 0,
                totalGuestClasses: 0,
            }
        );
    } catch (error) {
        console.error('Error fetching attendance stats:', error);
        throw new Error('Failed to fetch attendance statistics');
    }
};

export const attendanceService = {
    getAllAttendances,
    getAttendanceById,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    updateAttendanceStatus,
    getAttendanceStats,
};
