// server/controllers/course.controller.ts
import type { Request, Response } from 'express';
import { courseService } from './course.service';

export const courseController = {
    getAllCourses: async (req: Request, res: Response) => {
        try {
            const courses = await courseService.getAllCourses();
            res.json({
                success: true,
                message: 'Courses retrieved successfully',
                data: courses,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    getCourseById: async (req: Request, res: Response) => {
        try {
            const course = await courseService.getCourseById(req.params.id);
            res.json({
                success: true,
                message: 'Course retrieved successfully',
                data: course,
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
        }
    },

    createCourse: async (req: Request, res: Response) => {
        try {
            const course = await courseService.createCourse(req.body);
            res.status(201).json({
                success: true,
                message: 'Course created successfully',
                data: course,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    },

    updateCourse: async (req: Request, res: Response) => {
        try {
            const course = await courseService.updateCourse(req.params.id, req.body);
            res.json({
                success: true,
                message: 'Course updated successfully',
                data: course,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    },

    deleteCourse: async (req: Request, res: Response) => {
        try {
            await courseService.deleteCourse(req.params.id);
            res.json({
                success: true,
                message: 'Course deleted successfully',
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    },
};
