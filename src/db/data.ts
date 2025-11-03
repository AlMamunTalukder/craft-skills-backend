import { IUserRole } from 'src/modules/user/user.interface';

export const ADMIN_DATA = {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    phone: '1234567890',
    password: 'Admin123',
    role: IUserRole._ADMIN,
};

export const SITE_DATA = {
    name: 'Craft Skills',
    tagline: 'কথার জাদুতে মুগ্ধ করার ৫০ দিনের চ্যালেঞ্জ',
    logoHeader: '/uploads/logo-header.png',
    logoFooter: '/uploads/logo-footer.png',
    address:
        'ঢাকা-চট্টগ্রাম মহাসড়ক (চিটাগাং রোড) সংলগ্ন, মাদানি নগর মাদরাসা রোড, নিমাইকাশারী বাজার, কুয়েত টাওয়ার (স্বপ্ন সুপার শপ বিল্ডিং - ৫ম তলা), সিদ্ধিরগঞ্জ, নারায়ণগঞ্জ - ১৪৩০',
    phone1: '+8801310726000',
    phone2: '+8801700999093',
    email: 'craftskillsbd@gmail.com',
    facebook: 'https://facebook.com/craftskills',
    youtube: 'https://youtube.com/@craftskills',
    whatsapp: 'https://wa.me/8801310726000',
    instagram: 'https://instagram.com/craftskills',

    homeBannerInfo: {
        title: 'কথার জাদুতে মুগ্ধ করার ৫০ দিনের চ্যালেঞ্জ',
        subtitle: '৩৫ তম ফ্রি সেমিনারে যুক্ত হতে রেজিস্ট্রেশন করুন।',
        description: 'সময়ঃ ০৬ নভেম্বর – বৃহস্পতিবার – রাত ৯টা',
        otherInfo: 'ফ্রি সেমিনার কাউন্টডাউন চলছে',
    },

    admissionBannerInfo: {
        title: 'বিশেষ ছাড়ে ৩৫ তম আবর্তনে ভর্তি চলছে',
        subtitle: 'ডিসকাউন্ট পেতে দ্রুত ভর্তি নিশ্চিত করুন',
        description: 'সময়ঃ ১০ নভেম্বর – সোমবার – রাত ৯টা',
        otherInfo: 'অফার কাউন্টডাউন চলছে',
    },

    seminarHeaderTitle: '৫০ দিনের চ্যালেঞ্জ – ফ্রি সেমিনার',
    seminarHeaderDescription: 'রেজিস্ট্রেশন করে লাইভ সেশনে যুক্ত হন এবং কথার জাদু শেখা শুরু করুন।',
    seminarDeadline: new Date('2025-11-06T21:00:00'),

    admissionHeaderTitle: 'বিশেষ ছাড়ে ভর্তি চলছে!',
    admissionHeaderDescription: '৩৫ তম আবর্তনে ভর্তি হয়ে ডিসকাউন্ট নিন',
    admissionDeadline: new Date('2025-11-10T21:00:00'),
};
