// // server/controllers/studentAttendance.controller.ts
// import type { Request, Response } from 'express';
// // Import from the correct path based on your structure
// import * as studentAttendanceService from '../studentAttendance/studentAttendance.service';

// export const studentAttendanceController = {
//     // Get student's batches
//     getMyBatches: async (req: Request, res: Response) => {
//         try {
//             const studentId = (req as any).user.id;
//             const batches = await studentAttendanceService.getStudentBatches(studentId);

//             res.json({ success: true, data: batches });
//         } catch (error) {
//             res.status(500).json({
//                 success: false,
//                 message: error instanceof Error ? error.message : 'Failed to fetch batches',
//             });
//         }
//     },

//     // Get attendance routines for a batch
//     getAttendanceRoutines: async (req: Request, res: Response) => {
//         try {
//             const { batchId, type } = req.query;

//             if (!batchId) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Batch ID is required',
//                 });
//             }

//             const routines = await studentAttendanceService.getAttendanceRoutines(
//                 batchId as string,
//                 type as string,
//             );

//             res.json({ success: true, data: routines });
//         } catch (error) {
//             res.status(500).json({
//                 success: false,
//                 message: error instanceof Error ? error.message : 'Failed to fetch routines',
//             });
//         }
//     },

//     // Get student's attendance for a batch
//     getMyAttendance: async (req: Request, res: Response) => {
//         try {
//             const studentId = (req as any).user.id;
//             const { batchId } = req.query;

//             if (!batchId) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Batch ID is required',
//                 });
//             }

//             const attendance = await studentAttendanceService.getStudentAttendance(
//                 studentId,
//                 batchId as string,
//             );

//             res.json({ success: true, data: attendance });
//         } catch (error) {
//             res.status(500).json({
//                 success: false,
//                 message: error instanceof Error ? error.message : 'Failed to fetch attendance',
//             });
//         }
//     },

//     // Save student attendance
//     // In studentAttendance.controller.ts, add logging to saveAttendance:

//     saveAttendance: async (req: Request, res: Response) => {
//         try {
//             console.log('Save attendance request body:', req.body);

//             const studentId = (req as any).user.id;
//             const { attendanceRoutineId, attendanceData, batchId, attendanceType } = req.body;

//             if (!attendanceRoutineId || !attendanceData || !batchId || !attendanceType) {
//                 console.error('Missing required fields:', {
//                     attendanceRoutineId,
//                     attendanceData,
//                     batchId,
//                     attendanceType,
//                 });
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Missing required fields',
//                 });
//             }

//             const savedAttendance = await studentAttendanceService.saveStudentAttendance({
//                 studentId,
//                 attendanceRoutineId,
//                 attendanceData,
//                 batchId,
//                 attendanceType,
//             });

//             console.log('Attendance saved successfully:', savedAttendance._id);

//             res.json({
//                 success: true,
//                 message: 'Attendance saved successfully',
//                 data: savedAttendance,
//             });
//         } catch (error) {
//             console.error('Save attendance error:', error);
//             res.status(400).json({
//                 success: false,
//                 message: error instanceof Error ? error.message : 'Failed to save attendance',
//             });
//         }
//     },
//     // Get attendance statistics
//     getAttendanceStats: async (req: Request, res: Response) => {
//         try {
//             const studentId = (req as any).user.id;
//             const { batchId } = req.query;

//             if (!batchId) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Batch ID is required',
//                 });
//             }

//             const stats = await studentAttendanceService.getAttendanceStats(
//                 studentId,
//                 batchId as string,
//             );

//             res.json({ success: true, data: stats });
//         } catch (error) {
//             res.status(500).json({
//                 success: false,
//                 message: error instanceof Error ? error.message : 'Failed to fetch stats',
//             });
//         }
//     },
// };
