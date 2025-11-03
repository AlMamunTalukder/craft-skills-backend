import { Router } from 'express';

import galleryController from './gallery.controller';
import { upload } from 'src/utils/cloudinary';
import { auth } from 'src/middleware/auth';

const galleryRoutes = Router();

galleryRoutes.get('/', auth(['admin']), galleryController.getAllImages);
galleryRoutes.post('/', auth(['admin']), upload.array('images', 5), galleryController.createImage);
galleryRoutes.delete('/:id', auth(['admin']), galleryController.deleteImage);

export default galleryRoutes;
