"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExclusiveOfferParticipant = void 0;
const mongoose_1 = require("mongoose");
const ExclusiveOfferParticipantSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, trim: true },
    occupation: { type: String, trim: true },
    price: { type: Number, default: 199 },
    paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    paymentMethod: { type: String, default: 'sslcommerz' },
    transactionId: {
        type: String,
    },
    sslValidationId: { type: String },
    addedByAdmin: { type: Boolean, default: false },
    visitorId: { type: String },
    // ✅ ADD THIS - Link to batch
    batchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ExclusiveBatch',
        required: false,
    },
    // ✅ Prevents duplicate Google Sheet rows per transaction
    sheetSynced: { type: Boolean, default: false },
}, { timestamps: true, collection: 'exclusive_offer_participants' });
ExclusiveOfferParticipantSchema.index({ createdAt: -1 });
ExclusiveOfferParticipantSchema.index({ batchId: 1 });
ExclusiveOfferParticipantSchema.index({ transactionId: 1 }); // ✅ Kills collection scans on payment lookups
ExclusiveOfferParticipantSchema.index({ sheetSynced: 1 });
exports.ExclusiveOfferParticipant = mongoose_1.models.ExclusiveOfferParticipant ||
    (0, mongoose_1.model)('ExclusiveOfferParticipant', ExclusiveOfferParticipantSchema);
