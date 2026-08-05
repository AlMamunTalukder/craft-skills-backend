"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("./auth.controller"));
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const auth_dto_1 = require("./auth.dto");
const authRoutes = (0, express_1.Router)();
authRoutes.post('/register', (0, validateRequest_1.default)(auth_dto_1.RegisterDto), auth_controller_1.default.register);
authRoutes.post('/login', (0, validateRequest_1.default)(auth_dto_1.LoginDto), auth_controller_1.default.login);
authRoutes.post('/logout', auth_controller_1.default.logout);
exports.default = authRoutes;
