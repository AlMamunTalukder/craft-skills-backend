import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface IGallery extends Document {
    
    url: string;
    publicId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}
