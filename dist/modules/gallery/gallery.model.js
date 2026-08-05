"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const gallerySchema = new mongoose_1.Schema({
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    name: { type: String, required: true },
}, {
    timestamps: true,
});
const Gallery = mongoose_1.models.Gallery || (0, mongoose_1.model)('Gallery', gallerySchema);
exports.default = Gallery;
