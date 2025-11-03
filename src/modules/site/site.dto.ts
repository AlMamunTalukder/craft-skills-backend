import { z } from 'zod';

export const siteDto = z.object({
    name: z.string(),
    logoHeader: z.string(),
    logoFooter: z.string(),
    tagline: z.string(),
    address: z.string(),
    phone1: z.string(),
    phone2: z.string().optional(),
    email: z.string().email(),

    facebook: z.string().url().optional(),
    facebookGroup: z.string().url().optional(),
    whatsapp: z.string().optional(),
    youtube: z.string().url().optional(),
    telegram: z.string().url().optional(),
    instagram: z.string().url().optional(),

    homeBannerInfo: z.object({
        title: z.string(),
        subtitle: z.string(),
        description: z.string(),
        otherInfo: z.string().optional(),
    }),

    admissionBannerInfo: z.object({
        title: z.string(),
        subtitle: z.string(),
        description: z.string(),
        otherInfo: z.string().optional(),
    }),

    seminarHeaderTitle: z.string().optional(),
    seminarHeaderDescription: z.string().optional(),
    seminarDeadline: z.coerce.date().optional(),

    admissionHeaderTitle: z.string().optional(),
    admissionHeaderDescription: z.string().optional(),
    admissionDeadline: z.coerce.date().optional(),
});

export type SiteDto = z.infer<typeof siteDto>;
