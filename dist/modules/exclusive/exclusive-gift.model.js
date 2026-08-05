"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExclusiveGift = void 0;
const mongoose_1 = require("mongoose");
const ExclusiveGiftSchema = new mongoose_1.Schema({
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
    batchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ExclusiveBatch',
        required: true,
    },
}, {
    timestamps: true,
    collection: 'exclusive_gifts',
});
exports.ExclusiveGift = mongoose_1.models.ExclusiveGift || (0, mongoose_1.model)('ExclusiveGift', ExclusiveGiftSchema);
