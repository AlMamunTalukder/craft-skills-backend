import { Router } from 'express';
import uploadController from './upload.controller';
import { auth } from 'src/middleware/auth';
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
    },
});

const uploadRoutes = Router();

// This creates the POST /upload route
uploadRoutes.post('/', auth(['admin']), upload.single('file'), uploadController.uploadImage);

export default uploadRoutes;
