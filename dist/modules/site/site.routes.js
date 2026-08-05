"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const site_controller_1 = require("./site.controller");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const site_dto_1 = require("./site.dto");
const auth_1 = require("../../middleware/auth");
const menu_settings_dto_1 = require("./menu-settings.dto");
const siteRoutes = (0, express_1.Router)();
siteRoutes.get('/', site_controller_1.siteController.getSiteData);
siteRoutes.put('/', (0, auth_1.auth)(['admin']), (0, validateRequest_1.default)(site_dto_1.siteDto), site_controller_1.siteController.updateSiteData);
// ✅ Make sure this route exists and is correctly defined
siteRoutes.put('/menu-settings', (0, auth_1.auth)(['admin']), (0, validateRequest_1.default)(menu_settings_dto_1.menuSettingsDto), site_controller_1.siteController.updateMenuSettings);
exports.default = siteRoutes;
