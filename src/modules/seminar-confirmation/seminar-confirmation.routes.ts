// src/modules/seminar-confirmation/seminar-confirmation.routes.ts
import { Router } from 'express';
import validateRequest from 'src/utils/validateRequest';
import { seminarConfirmationDto } from './seminar-confirmation.dto';
import { seminarConfirmationController } from './seminar-confirmation.controller';

const router = Router();

router.post(
    '/confirm',
    validateRequest(seminarConfirmationDto),
    seminarConfirmationController.confirmParticipation,
);

router.get('/confirm', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Seminar confirmation endpoint is active. Use POST method to submit data.',
        endpoint: 'POST /api/v1/seminar-confirmations/confirm',
        required_fields: ['name', 'phone', 'whatsapp', 'email', 'seminarId'],
    });
});

export const SeminarConfirmationRoutes = router;
