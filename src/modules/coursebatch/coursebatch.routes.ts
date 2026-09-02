import { Router } from 'express';
import { courseBatchController } from './coursebatch.controller';
import validateRequest from 'src/utils/validateRequest';
import { createBatchDto, updateBatchDto } from './coursebatch.dto';
import { auth } from 'src/middleware/auth';

const router = Router();

// Public sanitized - no secrets for Ads (secrets hidden in service getActiveBatchPublic)
router.get('/active', courseBatchController.getActiveBatch);
router.get('/check/:batchNumber', courseBatchController.checkBatchExists);

// Private - admin only (leaked Batch 39-43 secrets before)
router.get('/', auth(['admin']), courseBatchController.getAllBatches);
router.get('/:id', auth(['admin']), courseBatchController.getBatchById);

// Protected routes with validation
router.post('/', auth(['admin']), validateRequest(createBatchDto), courseBatchController.createBatch);
router.put('/:id', auth(['admin']), validateRequest(updateBatchDto), courseBatchController.updateBatch);
router.put('/:id/status', auth(['admin']), courseBatchController.changeStatus);
router.delete('/:id', auth(['admin']), courseBatchController.deleteBatch);

export const courseBatchRoutes = router;
