"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.siteDto = exports.menuSettingsDto = void 0;
const zod_1 = require("zod");
exports.menuSettingsDto = zod_1.z.object({
    admission: zod_1.z.boolean().optional(),
    review: zod_1.z.boolean().optional(),
    exclusive: zod_1.z.boolean().optional(),
    gift: zod_1.z.boolean().optional(),
});
exports.siteDto = zod_1.z.object({
    name: zod_1.z.string(),
    logoHeader: zod_1.z.string(),
    logoFooter: zod_1.z.string(),
    tagline: zod_1.z.string(),
    address: zod_1.z.string(),
    phone1: zod_1.z.string(),
    phone2: zod_1.z.string().optional(),
    email: zod_1.z.string().email(),
    facebook: zod_1.z.string().url().optional(),
    facebookGroup: zod_1.z.string().url().optional(),
    whatsapp: zod_1.z.string().optional(),
    whatsappNumber: zod_1.z.string().optional(),
    youtube: zod_1.z.string().url().optional(),
    telegram: zod_1.z.string().url().optional(),
    instagram: zod_1.z.string().url().optional(),
    homeBannerInfo: zod_1.z.object({
        title: zod_1.z.string(),
        subtitle: zod_1.z.string(),
        description: zod_1.z.string(),
        otherInfo: zod_1.z.string().optional(),
    }),
    admissionBannerInfo: zod_1.z.object({
        title: zod_1.z.string(),
        subtitle: zod_1.z.string(),
        description: zod_1.z.string(),
        otherInfo: zod_1.z.string().optional(),
    }),
    seminarHeaderTitle: zod_1.z.string().optional(),
    seminarHeaderDescription: zod_1.z.string().optional(),
    seminarDeadline: zod_1.z.coerce.date().optional(),
    admissionHeaderTitle: zod_1.z.string().optional(),
    admissionHeaderDescription: zod_1.z.string().optional(),
    admissionDeadline: zod_1.z.coerce.date().optional(),
    totalsTeachers: zod_1.z.number().optional(),
    totalCourses: zod_1.z.number().optional(),
    totalBatches: zod_1.z.number().optional(),
    successRate: zod_1.z.number().optional(),
    menuSettings: exports.menuSettingsDto.optional(),
});
