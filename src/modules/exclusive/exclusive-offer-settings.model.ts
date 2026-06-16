import { Schema, model, models } from 'mongoose';

export interface IExclusiveOfferSettings {
    price: number;
    createdAt: Date;
    updatedAt: Date;
}

const ExclusiveOfferSettingsSchema = new Schema<IExclusiveOfferSettings>(
    {
        price: { type: Number, default: 199 },
    },
    { timestamps: true, collection: 'exclusive_offer_settings' },
);

export const ExclusiveOfferSettings =
    models.ExclusiveOfferSettings ||
    model<IExclusiveOfferSettings>('ExclusiveOfferSettings', ExclusiveOfferSettingsSchema);
