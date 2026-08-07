"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExclusiveBatch = void 0;
const mongoose_1 = require("mongoose");
const ExclusiveBatchSchema = new mongoose_1.Schema({
    batchNo: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    date: {
        type: Date,
        required: true,
    },
    registrationDeadline: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    offerPrice: {
        type: Number,
        default: 199,
    },
    regularPrice: {
        type: Number,
        default: 5500,
    },
    whatsappGroupLink: {
        type: String,
        trim: true,
    },
    giftDriveLink: {
        type: String,
        trim: true,
    },
    enrolledCount: {
        type: Number,
        default: 0,
    },
    participants: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'ExclusiveOfferParticipant',
        },
    ],
}, {
    timestamps: true,
    collection: 'exclusive_batches',
});
ExclusiveBatchSchema.index({ isActive: 1 });
ExclusiveBatchSchema.index({ date: 1 });
exports.ExclusiveBatch = mongoose_1.models.ExclusiveBatch || (0, mongoose_1.model)('ExclusiveBatch', ExclusiveBatchSchema);
