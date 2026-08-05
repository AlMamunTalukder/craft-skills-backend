"use strict";
// server/services/course.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseService = void 0;
const course_model_1 = require("./course.model");
const getAllCourses = async () => {
    const courses = await course_model_1.Course.find()
        .select('name description price discount paymentCharge createdAt')
        .sort({ createdAt: -1 })
        .lean();
    return courses;
};
const getCourseById = async (id) => {
    const course = await course_model_1.Course.findById(id).lean();
    if (!course)
        throw new Error('Course not found');
    return course;
};
const createCourse = async (courseData) => {
    const course = new course_model_1.Course(courseData);
    return await course.save();
};
const updateCourse = async (id, courseData) => {
    const course = await course_model_1.Course.findByIdAndUpdate(id, courseData, {
        new: true,
        runValidators: true,
        lean: true,
    }).lean();
    if (!course)
        throw new Error('Course not found');
    return course;
};
const deleteCourse = async (id) => {
    const course = await course_model_1.Course.findByIdAndDelete(id);
    if (!course)
        throw new Error('Course not found');
};
exports.courseService = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
};
