import { Router } from 'express';
import { createSeminarDto, updateSeminarDto, registerParticipantDto } from './seminar.dto';
import { seminarController } from './seminar.controller';
import validateRequest from 'src/utils/validateRequest';
import { participantController } from './participant.controller';
import { seminarConfirmationDto } from '../seminar-confirmation/seminar-confirmation.dto';
import { seminarConfirmationController } from '../seminar-confirmation/seminar-confirmation.controller';

const router = Router();

// REMOVE auth middleware temporarily for testing
router.post(
    '/',
    // auth(['admin']), // COMMENT THIS LINE OUT
    validateRequest(createSeminarDto),
    seminarController.createSeminar,
);

router.get('/', seminarController.getAllSeminars);
router.get('/active', seminarController.getActiveSeminar); // Add this route
router.get('/:id', seminarController.getSeminarById);

router.put(
    '/:id',
    // auth(['admin']), // COMMENT THIS LINE OUT
    validateRequest(updateSeminarDto),
    seminarController.updateSeminar,
);

router.put('/:id/status', seminarController.changeStatus);
router.delete('/:id', seminarController.deleteSeminar);
router.post('/register', validateRequest(registerParticipantDto), participantController.register);
router.post(
    '/confirm',
    validateRequest(seminarConfirmationDto),
    seminarConfirmationController.confirmParticipation,
);

export const SeminarRoutes = router;
