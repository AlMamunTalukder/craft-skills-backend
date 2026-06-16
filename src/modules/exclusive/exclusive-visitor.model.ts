import { Schema, model, models } from 'mongoose';

export interface IExclusiveVisitor {
    visitorId: string;
    stage: number;
    expiryTime: Date;
    isBlocked: boolean;
    registered: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ExclusiveVisitorSchema = new Schema<IExclusiveVisitor>(
    {
        visitorId: { type: String, required: true, unique: true },
        stage: { type: Number, default: 1 },
        expiryTime: { type: Date, required: true },
        isBlocked: { type: Boolean, default: false },
        registered: { type: Boolean, default: false },
    },
    { timestamps: true },
);

export const ExclusiveVisitor =
    models.ExclusiveVisitor || model<IExclusiveVisitor>('ExclusiveVisitor', ExclusiveVisitorSchema);
