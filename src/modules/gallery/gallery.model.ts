import { model, models, Schema } from 'mongoose';
import type { IGallery } from './gallery.interface';

const gallerySchema = new Schema<IGallery>(
    {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        name: { type: String, required: true },
    },
    {
        timestamps: true,
    },
);

const Gallery = models.Gallery || model<IGallery>('Gallery', gallerySchema);

export default Gallery;
