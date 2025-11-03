import { Schema, model, models } from 'mongoose';
import type { ISite } from './site.interface';

const siteSchema = new Schema<ISite>(
    {
        name: { type: String, required: true },
        logoHeader: { type: String, required: true },
        logoFooter: { type: String, required: true },
        tagline: { type: String, required: true },
        address: { type: String, required: true },
        phone1: { type: String, required: true },
        phone2: { type: String },
        email: { type: String, required: true },
        facebook: { type: String },
        facebookGroup: { type: String },
        whatsapp: { type: String },
        youtube: { type: String },
        telegram: { type: String },
        instagram: { type: String },

        homeBannerInfo: {
            title: { type: String, required: true },
            subtitle: { type: String, required: true },
            description: { type: String, required: true },
            otherInfo: { type: String },
        },

        admissionBannerInfo: {
            title: { type: String, required: true },
            subtitle: { type: String, required: true },
            description: { type: String, required: true },
            otherInfo: { type: String },
        },

        seminarHeaderTitle: { type: String },
        seminarHeaderDescription: { type: String },
        seminarDeadline: { type: Date },

        admissionHeaderTitle: { type: String },
        admissionHeaderDescription: { type: String },
        admissionDeadline: { type: Date },
    },
    { timestamps: true },
);

const Site = models.Site || model<ISite>('Site', siteSchema);

export default Site;
