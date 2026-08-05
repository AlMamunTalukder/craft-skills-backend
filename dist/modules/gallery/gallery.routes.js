"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gallery_controller_1 = __importDefault(require("./gallery.controller"));
const cloudinary_1 = require("../../utils/cloudinary");
const auth_1 = require("../../middleware/auth");
const galleryRoutes = (0, express_1.Router)();
galleryRoutes.get('/', (0, auth_1.auth)(['admin']), gallery_controller_1.default.getAllImages);
galleryRoutes.post('/', (0, auth_1.auth)(['admin']), cloudinary_1.upload.array('images', 5), gallery_controller_1.default.createImage);
galleryRoutes.delete('/:id', (0, auth_1.auth)(['admin']), gallery_controller_1.default.deleteImage);
exports.default = galleryRoutes;
