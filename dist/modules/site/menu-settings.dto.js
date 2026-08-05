"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuSettingsDto = void 0;
// menu-settings.dto.ts
const zod_1 = require("zod");
exports.menuSettingsDto = zod_1.z.object({
    admission: zod_1.z.boolean().optional(),
    review: zod_1.z.boolean().optional(),
    exclusive: zod_1.z.boolean().optional(),
    gift: zod_1.z.boolean().optional(),
});
