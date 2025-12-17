// import { Router } from 'express';
// import { auth } from '../../middleware/auth';
// import validateRequest from '../../utils/validateRequest';
// import seminarController from './seminar.controller';
// import { createSeminarDto, updateSeminarDto, registerParticipantDto } from './seminar.dto';

// const router = Router();

// router.post(
//     '/',
//     auth(['admin']),
//     validateRequest(createSeminarDto),
//     seminarController.createSeminar,
// );

// router.get('/', seminarController.getAllSeminars);

// router.get('/:id', seminarController.getSeminarById);

// router.put(
//     '/:id',
//     auth(['admin']),
//     validateRequest(updateSeminarDto),
//     seminarController.updateSeminar,
// );
// router.put('/:id/status', auth(['admin']), seminarController.changeStatus);

// router.delete('/:id', auth(['admin']), seminarController.deleteSeminar);

// router.post(
//     '/register',
//     validateRequest(registerParticipantDto),
//     seminarController.registerParticipant,
// );

// export const SeminarRoutes = router;

// server/routes/seminar.route.ts
import { Router } from 'express';
import { createSeminarDto, updateSeminarDto } from './seminar.dto';
import { seminarController } from './seminar.controller';
import validateRequest from 'src/utils/validateRequest';
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

export const SeminarRoutes = router;
