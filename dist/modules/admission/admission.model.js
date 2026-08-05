"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Admission = void 0;
const mongoose_1 = require("mongoose");
const AdmissionSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                return !v || /^\S+@\S+\.\S+$/.test(v);
            },
            message: 'Invalid email format',
        },
    },
    phone: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return !v || /^[0-9+]{10,15}$/.test(v);
            },
            message: 'Invalid phone number',
        },
    },
    whatsapp: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return !v || /^[0-9+]{10,15}$/.test(v);
            },
            message: 'Invalid WhatsApp number',
        },
    },
    facebook: {
        type: String,
        trim: true,
    },
    courseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course is required'],
    },
    batchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'CourseBatch',
        required: [true, 'Batch is required'],
    },
    paymentMethod: {
        type: String,
        trim: true,
    },
    senderNumber: {
        type: String,
        trim: true,
    },
    couponCode: {
        type: String,
        trim: true,
        uppercase: true,
    },
    amount: {
        type: Number,
        min: 0,
    },
    discountAmount: {
        type: Number,
        min: 0,
        default: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'waitlisted'],
        default: 'pending',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'cancelled'],
        default: 'pending',
    },
    result: {
        type: String,
        enum: ['pending', 'needs improvement', 'average', 'good', 'very good', 'excellent'],
        default: 'pending',
    },
    notes: {
        type: String,
        trim: true,
    },
    registeredAt: {
        type: Date,
        default: Date.now,
    },
    agreedToTerms: {
        type: Boolean,
        required: [true, 'Terms agreement is required'],
        default: false,
    },
    agreedToTermsAt: {
        type: Date,
        default: Date.now,
    },
    termsVersion: {
        type: String,
        default: '1.0',
    },
}, {
    timestamps: true,
});
// Add indexes
AdmissionSchema.index({ batchId: 1 });
AdmissionSchema.index({ courseId: 1 });
AdmissionSchema.index({ status: 1 });
AdmissionSchema.index({ paymentStatus: 1 });
AdmissionSchema.index({ result: 1 });
AdmissionSchema.index({ registeredAt: -1 });
AdmissionSchema.index({ name: 'text', email: 'text', phone: 'text' });
AdmissionSchema.index({ agreedToTerms: 1 });
exports.Admission = mongoose_1.models.Admission || (0, mongoose_1.model)('Admission', AdmissionSchema);
