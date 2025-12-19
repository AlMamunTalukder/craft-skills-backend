// server/services/course.service.ts

import { Course, type ICourse } from "./course.model";

const getAllCourses = async (): Promise<ICourse[]> => {
    const courses = await Course.find()
        .select('name description price discount paymentCharge createdAt')
        .sort({ createdAt: -1 })
        .lean<ICourse[]>();

    return courses;
};

const getCourseById = async (id: string): Promise<ICourse> => {
    const course = await Course.findById(id).lean<ICourse>();
    if (!course) throw new Error('Course not found');
    return course;
};

const createCourse = async (courseData: Partial<ICourse>): Promise<ICourse> => {
    const course = new Course(courseData);
    return await course.save();
};

const updateCourse = async (id: string, courseData: Partial<ICourse>): Promise<ICourse> => {
    const course = await Course.findByIdAndUpdate(id, courseData, {
        new: true,
        runValidators: true,
        lean: true,
    }).lean<ICourse>();

    if (!course) throw new Error('Course not found');
    return course;
};

const deleteCourse = async (id: string): Promise<void> => {
    const course = await Course.findByIdAndDelete(id);
    if (!course) throw new Error('Course not found');
};

export const courseService = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
};
