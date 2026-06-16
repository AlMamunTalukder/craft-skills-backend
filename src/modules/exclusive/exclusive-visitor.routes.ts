import { Router } from 'express';
import { getVisitorStatus, markAsRegistered } from './exclusive-visitor.controller';

const router = Router();

router.get('/visitor-status', getVisitorStatus); // → /exclusive/visitor-status
router.post('/register-success', markAsRegistered); // → /exclusive/register-success

export const ExclusiveVisitorRoutes = router;
