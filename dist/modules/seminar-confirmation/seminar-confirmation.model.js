"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeminarConfirmation = void 0;
// server/models/seminar-confirmation.model.ts
const mongoose_1 = require("mongoose");
const SeminarConfirmationSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    whatsapp: {
        type: String,
        trim: true,
    },
    occupation: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    confirmedAt: {
        type: Date,
        default: Date.now,
    },
    seminarId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Seminar',
        required: true,
    },
}, {
    timestamps: true,
});
exports.SeminarConfirmation = mongoose_1.models.SeminarConfirmation ||
    (0, mongoose_1.model)('SeminarConfirmation', SeminarConfirmationSchema);
