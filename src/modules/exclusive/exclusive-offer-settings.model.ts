import { Schema, model, models } from 'mongoose';

export interface IExclusiveOfferSettings {
    price: number;
    date?: string; // e.g. "2026-07-15" or display string
    whatsappLink?: string;
    fbLink?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ExclusiveOfferSettingsSchema = new Schema<IExclusiveOfferSettings>(
    {
        price: { type: Number, default: 199 },
        date: { type: String, default: '' },
        whatsappLink: { type: String, default: '' },
        fbLink: { type: String, default: '' },
    },
    { timestamps: true, collection: 'exclusive_offer_settings' },
);

export const ExclusiveOfferSettings =
    models.ExclusiveOfferSettings ||
    model<IExclusiveOfferSettings>('ExclusiveOfferSettings', ExclusiveOfferSettingsSchema);
