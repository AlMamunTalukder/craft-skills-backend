import type { Document } from 'mongoose';
import type { ObjectId } from 'mongodb';

export interface ISite extends Document {
    _id: string | ObjectId;
    name: string;
    logoHeader: string;
    logoFooter: string;
    tagline: string;
    address: string;
    phone1: string;
    phone2?: string;
    email: string;
    facebook?: string;
    facebookGroup?: string;
    whatsapp?: string;
    youtube?: string;
    telegram?: string;
    instagram?: string;
    homeBannerInfo: {
        title: string;
        subtitle: string;
        description: string;
        otherInfo?: string;
    };
    admissionBannerInfo: {
        title: string;
        subtitle: string;
        description: string;
        otherInfo?: string;
    };
    seminarHeaderTitle?: string;
    seminarHeaderDescription?: string;
    seminarDeadline?: Date;
    admissionHeaderTitle?: string;
    admissionHeaderDescription?: string;
    admissionDeadline?: Date;
}
