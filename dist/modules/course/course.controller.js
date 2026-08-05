"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseController = void 0;
const course_service_1 = require("./course.service");
exports.courseController = {
    getAllCourses: async (req, res) => {
        try {
            const courses = await course_service_1.courseService.getAllCourses();
            res.json({
                success: true,
                message: 'Courses retrieved successfully',
                data: courses,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    getCourseById: async (req, res) => {
        try {
            const course = await course_service_1.courseService.getCourseById(String(req.params.id));
            res.json({
                success: true,
                message: 'Course retrieved successfully',
                data: course,
            });
        }
        catch (error) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
        }
    },
    createCourse: async (req, res) => {
        try {
            const course = await course_service_1.courseService.createCourse(req.body);
            res.status(201).json({
                success: true,
                message: 'Course created successfully',
                data: course,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    },
    updateCourse: async (req, res) => {
        try {
            const course = await course_service_1.courseService.updateCourse(String(req.params.id), req.body);
            res.json({
                success: true,
                message: 'Course updated successfully',
                data: course,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    },
    deleteCourse: async (req, res) => {
        try {
            await course_service_1.courseService.deleteCourse(String(req.params.id));
            res.json({
                success: true,
                message: 'Course deleted successfully',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    },
};
