import type { Document } from 'mongoose';
import type { ObjectId } from 'mongodb';

export interface ISchedule extends Document {
    _id: string | ObjectId;
    className: string;
    days: string;
    time: string;
    holidays?: string;
}
