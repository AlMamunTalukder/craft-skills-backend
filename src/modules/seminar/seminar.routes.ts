import { Router } from 'express';
import { createSeminarDto, updateSeminarDto } from './seminar.dto';
import { seminarController } from './seminar.controller';
import validateRequest from 'src/utils/validateRequest';
import { participantController } from './participant.controller';
// import { auth } from '../middleware/auth'; // COMMENT OUT FOR NOW

const router = Router();

// REMOVE auth middleware temporarily for testing
router.post(
    '/',
    // auth(['admin']), // COMMENT THIS LINE OUT
    validateRequest(createSeminarDto),
    seminarController.createSeminar,
);

router.get('/', seminarController.getAllSeminars);
router.get('/:id', seminarController.getSeminarById);

router.put(
    '/:id',
    // auth(['admin']), // COMMENT THIS LINE OUT
    validateRequest(updateSeminarDto),
    seminarController.updateSeminar,
);

router.put('/:id/status', seminarController.changeStatus);
router.delete('/:id', seminarController.deleteSeminar);
router.post('/register', participantController.register);

export const SeminarRoutes = router;
