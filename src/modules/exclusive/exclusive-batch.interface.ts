import type { Document } from 'mongoose';

export interface IExclusiveBatch extends Document {
    batchNo: string | number;
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    registrationDeadline: Date;
    regularPrice: number;
    offerPrice: number;
    isActive: boolean;
    maxSeats?: number;
    enrolledCount: number;
    courseTitle: string;
    createdAt: Date;
    updatedAt: Date;
}
