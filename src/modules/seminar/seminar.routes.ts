// server/routes/seminar.routes.ts
import { Router } from 'express';
import { createSeminarDto, updateSeminarDto, registerParticipantDto } from './seminar.dto';
import { seminarController } from './seminar.controller';
import validateRequest from 'src/utils/validateRequest';
import { participantController } from './participant.controller';
import { seminarConfirmationDto } from '../seminar-confirmation/seminar-confirmation.dto';
import { seminarConfirmationController } from '../seminar-confirmation/seminar-confirmation.controller';

const router = Router();

// Public routes (no auth)
router.post('/register', validateRequest(registerParticipantDto), participantController.register);
router.post(
    '/confirm',
    validateRequest(seminarConfirmationDto),
    seminarConfirmationController.confirmParticipation,
);

// GET routes – specific ones BEFORE dynamic
router.get('/', seminarController.getAllSeminars);
router.get('/active', seminarController.getActiveSeminar);
router.get('/pdf-seminar', seminarController.getPdfSeminar);

// Dynamic routes (must be LAST)
router.get('/:id', seminarController.getSeminarById);

// Admin routes (with auth if needed)
router.post('/', validateRequest(createSeminarDto), seminarController.createSeminar);
router.put('/:id', validateRequest(updateSeminarDto), seminarController.updateSeminar);
router.put('/:id/status', seminarController.changeStatus);
router.delete('/:id', seminarController.deleteSeminar);

export const SeminarRoutes = router;
