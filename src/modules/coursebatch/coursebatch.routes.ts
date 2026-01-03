import { Router } from 'express';
import { courseBatchController } from './coursebatch.controller';
import validateRequest from 'src/utils/validateRequest';
import { createBatchDto, updateBatchDto } from './coursebatch.dto';

const router = Router();

// Add this route before parameterized routes
router.get('/check/:batchNumber', courseBatchController.checkBatchExists);

// Public routes
router.get('/', courseBatchController.getAllBatches);
router.get('/active', courseBatchController.getActiveBatch);
router.get('/:id', courseBatchController.getBatchById);

// Protected routes with validation
router.post('/', validateRequest(createBatchDto), courseBatchController.createBatch);
router.put('/:id', validateRequest(updateBatchDto), courseBatchController.updateBatch);
router.put('/:id/status', courseBatchController.changeStatus);
router.delete('/:id', courseBatchController.deleteBatch);

export const courseBatchRoutes = router;
