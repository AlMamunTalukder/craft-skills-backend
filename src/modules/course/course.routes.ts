// server/routes/course.routes.ts
import { Router } from 'express';
import { courseController } from './course.controller';
import { createCourseDto, updateCourseDto } from './course.dto';
import validateRequest from 'src/utils/validateRequest';
import { auth } from 'src/middleware/auth';

const router = Router();

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Protected routes with validation
router.post('/', auth(['admin']), validateRequest(createCourseDto), courseController.createCourse);
router.put('/:id', auth(['admin']), validateRequest(updateCourseDto), courseController.updateCourse);
router.delete('/:id', auth(['admin']), courseController.deleteCourse);

export const courseRoutes = router;
