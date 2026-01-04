// import Attendance from '../attendance/attendance.model';
// import { CourseBatch } from '../coursebatch/coursebatch.model';
// import { User } from '../user/user.model';
// import { StudentAttendance } from './studentAttendance.model';
// import mongoose from 'mongoose';

// interface SaveAttendanceDto {
//     studentId: string;
//     attendanceRoutineId: string;
//     attendanceData: any;
//     batchId: string;
//     attendanceType: 'mainClasses' | 'guestClasses' | 'specialClasses';
// }

// export const saveStudentAttendance = async (data: SaveAttendanceDto) => {
//     try {
//         const { studentId, attendanceRoutineId, attendanceData, batchId, attendanceType } = data;

//         console.log('=== SAVE ATTENDANCE START ===');
//         console.log('Data received:', {
//             studentId,
//             attendanceRoutineId,
//             attendanceType,
//             batchId,
//             attendanceData: attendanceData,
//         });

//         // Validate ObjectId formats
//         if (!mongoose.Types.ObjectId.isValid(studentId)) {
//             throw new Error('Invalid student ID format');
//         }
//         if (!mongoose.Types.ObjectId.isValid(attendanceRoutineId)) {
//             throw new Error('Invalid attendance routine ID format');
//         }

//         const studentObjectId = new mongoose.Types.ObjectId(studentId);
//         const routineObjectId = new mongoose.Types.ObjectId(attendanceRoutineId);

//         // Check if student exists
//         const user = await User.findById(studentObjectId);
//         if (!user) {
//             throw new Error('Student not found');
//         }

//         // Check if attendance routine exists
//         const routine = await Attendance.findById(routineObjectId);
//         if (!routine) {
//             throw new Error('Attendance routine not found');
//         }

//         // Prepare the data structure that matches your database
//         const now = new Date();
//         const today = now.toISOString().split('T')[0];

//         // Get existing attendance if any
//         const existingAttendance = await StudentAttendance.findOne({
//             studentId: studentObjectId,
//             attendanceRoutineId: routineObjectId,
//         });

//         // Start with existing data or create new structure
//         let finalData: any = existingAttendance?.attendanceData || {
//             mainClasses: [],
//             guestClasses: [],
//             specialClasses: [],
//             metadata: {
//                 totalMainSessions: 0,
//                 totalGuestSessions: 0,
//                 totalSpecialSessions: 0,
//                 totalPresent: 0,
//                 totalSessions: 0,
//                 attendanceRate: 0,
//                 submittedAt: now,
//                 submittedDate: today,
//                 updatedAt: now,
//             },
//         };

//         // Update the specific attendance type with the received data
//         if (attendanceData && Array.isArray(attendanceData)) {
//             // Transform the data to match your structure
//             const transformedData = attendanceData.map((item: any) => ({
//                 className: item.className,
//                 sessions:
//                     item.sessions?.map((session: any) => ({
//                         type: session.type,
//                         name: session.name || session.type,
//                         attended: session.attended || false,
//                         attendance: session.attendance || { present: session.attended || false },
//                     })) || [],
//             }));

//             finalData[attendanceType] = transformedData;

//             // Recalculate statistics
//             let totalSessions = 0;
//             let totalPresent = 0;
//             let totalMain = 0;
//             let totalGuest = 0;
//             let totalSpecial = 0;

//             // Calculate for all types
//             ['mainClasses', 'guestClasses', 'specialClasses'].forEach((type) => {
//                 if (Array.isArray(finalData[type])) {
//                     finalData[type].forEach((classItem: any) => {
//                         if (classItem && Array.isArray(classItem.sessions)) {
//                             const sessions = classItem.sessions.length;
//                             const present = classItem.sessions.filter(
//                                 (s: any) => s.attended === true || s.attendance?.present === true,
//                             ).length;

//                             totalSessions += sessions;
//                             totalPresent += present;

//                             if (type === 'mainClasses') totalMain += sessions;
//                             else if (type === 'guestClasses') totalGuest += sessions;
//                             else if (type === 'specialClasses') totalSpecial += sessions;
//                         }
//                     });
//                 }
//             });

//             const attendanceRate = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;

//             // Update metadata
//             finalData.metadata = {
//                 totalMainSessions: totalMain,
//                 totalGuestSessions: totalGuest,
//                 totalSpecialSessions: totalSpecial,
//                 totalPresent: totalPresent,
//                 totalSessions: totalSessions,
//                 attendanceRate: attendanceRate,
//                 submittedAt: existingAttendance?.attendanceData?.metadata?.submittedAt || now,
//                 submittedDate: existingAttendance?.attendanceData?.metadata?.submittedDate || today,
//                 updatedAt: now,
//             };
//         }

//         console.log('Final data prepared. Stats:', finalData.metadata);

//         // Save attendance
//         const result = await StudentAttendance.findOneAndUpdate(
//             {
//                 studentId: studentObjectId,
//                 attendanceRoutineId: routineObjectId,
//                 batchId: batchId,
//             },
//             {
//                 studentId: studentObjectId,
//                 attendanceRoutineId: routineObjectId,
//                 batchId: batchId,
//                 attendanceData: finalData,
//             },
//             {
//                 new: true,
//                 upsert: true,
//                 runValidators: true,
//             },
//         );

//         console.log('Attendance saved successfully:', result._id);
//         console.log('=== SAVE ATTENDANCE END ===');

//         return result;
//     } catch (error: any) {
//         console.error('=== SAVE ATTENDANCE ERROR ===');
//         console.error('Error details:', error);
//         console.error('Error message:', error.message);
//         console.error('Error stack:', error.stack);
//         console.error('=== END ERROR ===');

//         if (error.code === 11000) {
//             throw new Error('Attendance already submitted for this routine');
//         }

//         throw new Error(`Failed to save attendance: ${error.message}`);
//     }
// };

// export const getAttendanceRoutines = async (batchId: string, type?: string) => {
//     try {
//         console.log('Fetching attendance routines for:', { batchId, type });

//         // First check if the attendance model exists
//         const AttendanceModel = Attendance;

//         // Build query
//         const query: any = {
//             batchId: batchId,
//             isActive: true,
//         };

//         if (type) {
//             // If type is provided, filter by class type
//             query['classes.type'] = type;
//         }

//         console.log('Query:', query);

//         // Execute query
//         const routines = await AttendanceModel.find(query).lean().exec();
//         console.log('Found routines:', routines.length);

//         return routines;
//     } catch (error) {
//         console.error('Error fetching attendance routines:', error);
//         throw new Error('Failed to fetch attendance routines');
//     }
// };

// // Export as named exports (not default)
// export const studentAttendanceService = {
//     getStudentBatches,
//     getAttendanceRoutines,
//     getStudentAttendance,
//     saveStudentAttendance,
//     getAttendanceStats,
// };

// // Also export individual functions for controller import
// export default {
//     getStudentBatches,
//     getAttendanceRoutines,
//     getStudentAttendance,
//     saveStudentAttendance,
//     getAttendanceStats,
// };
