// ============================================
// server/modules/exclusive-offer/exclusive-offer.service.ts
// ============================================

import AppError from 'src/errors/AppError';
import { appendDataToGoogleSheet } from 'src/utils/googleSheets';
import { sanitizePhoneNumber } from 'src/utils/phoneSanitizer';

import { ExclusiveOfferParticipant } from './exclusive-offer.model';

const registerParticipant = async (payload: any) => {
    try {
        const cleanPhone = sanitizePhoneNumber(payload.phone) || payload.phone;

        const participant = await ExclusiveOfferParticipant.create({
            ...payload,
            phone: cleanPhone,
        });

        // Registration Time
        const registrationDate = new Date().toLocaleString('en-BD', {
            timeZone: 'Asia/Dhaka',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

        // Google Sheet
        await appendDataToGoogleSheet(
            'Exclusive Offer Course',
            ['Name', 'Phone', 'Email', 'Course', 'Regular Price', 'Offer Price', 'Registered At'],
            [
                participant.name || '',
                cleanPhone || '',
                participant.email || '',
                participant.courseTitle || '',
                String(participant.regularPrice || 5500),
                String(participant.offerPrice || 190),
                registrationDate,
            ],
        );

        return participant;
    } catch (error: any) {
        throw new AppError(500, error.message);
    }
};

export const exclusiveOfferService = {
    registerParticipant,
};
