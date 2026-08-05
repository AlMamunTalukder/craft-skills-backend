"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExclusiveVisitor = void 0;
const mongoose_1 = require("mongoose");
const ExclusiveVisitorSchema = new mongoose_1.Schema({
    visitorId: { type: String, required: true, unique: true },
    stage: { type: Number, default: 1 },
    expiryTime: { type: Date, required: true },
    isBlocked: { type: Boolean, default: false },
    registered: { type: Boolean, default: false },
}, { timestamps: true });
exports.ExclusiveVisitor = mongoose_1.models.ExclusiveVisitor || (0, mongoose_1.model)('ExclusiveVisitor', ExclusiveVisitorSchema);
