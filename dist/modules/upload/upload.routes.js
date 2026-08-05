"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = __importDefault(require("./upload.controller"));
const auth_1 = require("../../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
    },
});
const uploadRoutes = (0, express_1.Router)();
// This creates the POST /upload route
uploadRoutes.post('/', (0, auth_1.auth)(['admin']), upload.single('file'), upload_controller_1.default.uploadImage);
exports.default = uploadRoutes;
