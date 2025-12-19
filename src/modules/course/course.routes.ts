// server/routes/course.routes.ts
import { Router } from 'express';
import { courseController } from './course.controller';
import { createCourseDto, updateCourseDto } from './course.dto';
import validateRequest from 'src/utils/validateRequest';

const router = Router();

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Protected routes with validation
router.post('/', validateRequest(createCourseDto), courseController.createCourse);
router.put('/:id', validateRequest(updateCourseDto), courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

export const courseRoutes = router;
