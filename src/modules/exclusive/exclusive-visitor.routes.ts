import { Router } from 'express';
import { getVisitorStatus, markAsRegistered } from './exclusive-visitor.controller';
import { visitorStatusLimiter } from 'src/utils/rateLimiter';

const router = Router();

router.get('/visitor-status', visitorStatusLimiter, getVisitorStatus); // → /exclusive/visitor-status
router.post('/register-success', markAsRegistered); // → /exclusive/register-success

export const ExclusiveVisitorRoutes = router;
