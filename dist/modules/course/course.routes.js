"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseRoutes = void 0;
// server/routes/course.routes.ts
const express_1 = require("express");
const course_controller_1 = require("./course.controller");
const course_dto_1 = require("./course.dto");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/', course_controller_1.courseController.getAllCourses);
router.get('/:id', course_controller_1.courseController.getCourseById);
// Protected routes with validation
router.post('/', (0, auth_1.auth)(['admin']), (0, validateRequest_1.default)(course_dto_1.createCourseDto), course_controller_1.courseController.createCourse);
router.put('/:id', (0, auth_1.auth)(['admin']), (0, validateRequest_1.default)(course_dto_1.updateCourseDto), course_controller_1.courseController.updateCourse);
router.delete('/:id', (0, auth_1.auth)(['admin']), course_controller_1.courseController.deleteCourse);
exports.courseRoutes = router;
