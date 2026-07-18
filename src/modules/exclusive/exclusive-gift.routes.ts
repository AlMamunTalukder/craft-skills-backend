import { Router } from 'express';
import validateRequest from 'src/utils/validateRequest';
import { exclusiveGiftDto } from './exclusive-gift.dto';
import { exclusiveGiftController } from './exclusive-gift.controller';

const router = Router();

router.post(
    '/confirm',
    validateRequest(exclusiveGiftDto),
    exclusiveGiftController.confirmGift,
);

router.get('/confirm', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Exclusive gift confirmation endpoint is active. Use POST method to submit data.',
        endpoint: 'POST /api/v1/exclusive-gift/confirm',
        required_fields: ['name', 'phone', 'whatsapp', 'email', 'batchId'],
    });
});

export const ExclusiveGiftRoutes = router;