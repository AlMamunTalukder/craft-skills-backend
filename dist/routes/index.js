"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const gallery_routes_1 = __importDefault(require("../modules/gallery/gallery.routes"));
const seminar_routes_1 = require("../modules/seminar/seminar.routes");
const site_routes_1 = __importDefault(require("../modules/site/site.routes"));
const user_routes_1 = __importDefault(require("../modules/user/user.routes"));
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: '/auth',
        route: auth_routes_1.default,
    },
    {
        path: '/users',
        route: user_routes_1.default,
    },
    {
        path: '/site',
        route: site_routes_1.default,
    },
    {
        path: '/gallery',
        route: gallery_routes_1.default,
    },
    {
        path: '/seminars',
        route: seminar_routes_1.SeminarRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
