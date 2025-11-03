import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface IGallery extends Document {
    _id: string | ObjectId;
    url: string;
    publicId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}
