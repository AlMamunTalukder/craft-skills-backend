"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExclusiveVisitorRoutes = void 0;
const express_1 = require("express");
const exclusive_visitor_controller_1 = require("./exclusive-visitor.controller");
const rateLimiter_1 = require("../../utils/rateLimiter");
const router = (0, express_1.Router)();
router.get('/visitor-status', rateLimiter_1.visitorStatusLimiter, exclusive_visitor_controller_1.getVisitorStatus); // → /exclusive/visitor-status
router.post('/register-success', exclusive_visitor_controller_1.markAsRegistered); // → /exclusive/register-success
exports.ExclusiveVisitorRoutes = router;
