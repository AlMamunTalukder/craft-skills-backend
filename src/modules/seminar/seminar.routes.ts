import { Router } from 'express';
import { auth } from '../../middleware/auth';
import validateRequest from '../../utils/validateRequest';
import seminarController from './seminar.controller';
import { createSeminarDto, updateSeminarDto, registerParticipantDto } from './seminar.dto';

const router = Router();

router.post(
    '/',
    auth(['admin']),
    validateRequest(createSeminarDto),
    seminarController.createSeminar,
);

router.get('/', seminarController.getAllSeminars);

router.get('/:id', seminarController.getSeminarById);

router.put(
    '/:id',
    auth(['admin']),
    validateRequest(updateSeminarDto),
    seminarController.updateSeminar,
);
router.put('/:id/status', auth(['admin']), seminarController.changeStatus);

router.delete('/:id', auth(['admin']), seminarController.deleteSeminar);

router.post(
    '/register',
    validateRequest(registerParticipantDto),
    seminarController.registerParticipant,
);

export const SeminarRoutes = router;
