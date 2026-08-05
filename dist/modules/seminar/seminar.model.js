"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Participant = exports.Seminar = void 0;
const mongoose_1 = require("mongoose");
const ParticipantSchema = new mongoose_1.Schema({
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
    registeredAt: {
        type: Date,
        default: Date.now,
    },
    seminarId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Seminar',
        required: true,
    },
}, {
    collection: 'participants',
    timestamps: false,
});
ParticipantSchema.index({ seminarId: 1 });
ParticipantSchema.index({ phone: 1 });
ParticipantSchema.index({ email: 1 });
ParticipantSchema.index({ registeredAt: -1 });
const SeminarSchema = new mongoose_1.Schema({
    sl: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    // link: { type: String },
    facebookSecretGroup: { type: String },
    whatsappSecretGroup: { type: String },
    messengerSecretGroup: { type: String },
    facebookPublicGroup: { type: String },
    whatsappPublicGroup: { type: String },
    telegramGroup: { type: String },
    participants: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Participant' }],
}, {
    timestamps: true,
});
SeminarSchema.index({ createdAt: -1 });
SeminarSchema.index({ isActive: 1 });
SeminarSchema.index({ date: 1 });
SeminarSchema.index({ title: 'text', description: 'text' });
exports.Seminar = mongoose_1.models.Seminar || (0, mongoose_1.model)('Seminar', SeminarSchema);
exports.Participant = mongoose_1.models.Participant || (0, mongoose_1.model)('Participant', ParticipantSchema);
