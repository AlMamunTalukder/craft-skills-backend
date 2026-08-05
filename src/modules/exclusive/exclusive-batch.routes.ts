import { Router } from 'express';
import { exclusiveBatchController } from './exclusive-batch.controller';
import validateRequest from 'src/utils/validateRequest';
import { auth } from 'src/middleware/auth';
import { createExclusiveBatchDto, updateExclusiveBatchDto } from './exclusive-batch.dto';

const router = Router();

// Public routes
router.get('/', exclusiveBatchController.getAllBatches);
router.get('/active', exclusiveBatchController.getActiveBatch);

// 🔐 Admin routes (Protected)
router.post(
    '/',
    auth(['admin']),
    validateRequest(createExclusiveBatchDto),
    exclusiveBatchController.createBatch,
);
router.get('/:id', auth(['admin']), exclusiveBatchController.getBatchById);
router.put(
    '/:id',
    auth(['admin']),
    validateRequest(updateExclusiveBatchDto),
    exclusiveBatchController.updateBatch,
);
router.put('/:id/status', auth(['admin']), exclusiveBatchController.changeStatus);
router.delete('/:id', auth(['admin']), exclusiveBatchController.deleteBatch);

export const ExclusiveBatchRoutes = router;
