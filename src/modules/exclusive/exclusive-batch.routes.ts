import { Router } from 'express';
import { exclusiveBatchController } from './exclusive-batch.controller';
import validateRequest from 'src/utils/validateRequest';
import { createExclusiveBatchDto, updateExclusiveBatchDto } from './exclusive-batch.dto';

const router = Router();

// Public routes
router.get('/active', exclusiveBatchController.getActiveBatch);

// CRUD routes (no /exclusive-batches prefix needed)
router.post('/', validateRequest(createExclusiveBatchDto), exclusiveBatchController.createBatch);
router.get('/', exclusiveBatchController.getAllBatches);
router.get('/:id', exclusiveBatchController.getBatchById);
router.put('/:id', validateRequest(updateExclusiveBatchDto), exclusiveBatchController.updateBatch);
router.put('/:id/status', exclusiveBatchController.toggleBatchStatus);
router.delete('/:id', exclusiveBatchController.deleteBatch);
router.get('/active', exclusiveBatchController.getActiveBatch);

export const ExclusiveBatchRoutes = router;
