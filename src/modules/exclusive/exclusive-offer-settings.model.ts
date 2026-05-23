import { Schema, model, models } from 'mongoose';

export interface IExclusiveOfferSettings {
  isActive: boolean;
  deadline: Date;          // UTC
  courseTitle: string;
  regularPrice: number;
  offerPrice: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExclusiveOfferSettingsSchema = new Schema<IExclusiveOfferSettings>(
  {
    isActive: { type: Boolean, default: true },
    deadline: { type: Date, required: true },
    courseTitle: { type: String, default: 'Voice & Public Speaking Masterclass' },
    regularPrice: { type: Number, default: 5500 },
    offerPrice: { type: Number, default: 199 },
    description: { type: String, default: '' },
  },
  { timestamps: true, collection: 'exclusive_offer_settings' }
);

// Singleton: ensure only one document exists
ExclusiveOfferSettingsSchema.statics.getSingleton = async function() {
  let doc = await this.findOne();
  if (!doc) {
    // default deadline 7 days from now
    const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    doc = await this.create({
      isActive: true,
      deadline: defaultDeadline,
      courseTitle: 'Voice & Public Speaking Masterclass',
      regularPrice: 5500,
      offerPrice: 199,
      description: '',
    });
  }
  return doc;
};

export const ExclusiveOfferSettings =
  models.ExclusiveOfferSettings ||
  model<IExclusiveOfferSettings>('ExclusiveOfferSettings', ExclusiveOfferSettingsSchema);