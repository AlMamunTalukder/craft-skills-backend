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
const upload_routes_1 = __importDefault(require("../modules/upload/upload.routes"));
const schedule_routes_1 = __importDefault(require("../modules/schedule/schedule.routes"));
const coursebatch_routes_1 = require("../modules/coursebatch/coursebatch.routes");
const course_routes_1 = require("../modules/course/course.routes");
const coupon_routes_1 = require("../modules/coupon/coupon.routes");
const attendance_routes_1 = require("../modules/attendance/attendance.routes");
const admission_routes_1 = require("../modules/admission/admission.routes");
const studentAttendance_routes_1 = require("../modules/studentAttendance/studentAttendance.routes");
const seminar_confirmation_routes_1 = require("../modules/seminar-confirmation/seminar-confirmation.routes");
const review_routes_1 = require("../modules/review/review.routes");
const router = (0, express_1.Router)();
// Debug route to see all registered routes
router.get('/debug-routes', (req, res) => {
    const allRoutes = [
        { path: '/auth', methods: ['POST'] },
        { path: '/users', methods: ['GET', 'POST'] },
        { path: '/site', methods: ['GET', 'PUT'] },
        { path: '/class-schedule', methods: ['GET', 'PUT'] },
        { path: '/gallery', methods: ['GET', 'POST'] },
        { path: '/seminars', methods: ['GET', 'POST'] },
        { path: '/upload', methods: ['POST'] },
    ];
    res.json({
        message: 'Registered routes',
        routes: allRoutes.map((route) => ({
            fullPath: `/api/v1${route.path}`,
            methods: route.methods,
        })),
    });
});
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
        path: '/class-schedule',
        route: schedule_routes_1.default,
    },
    {
        path: '/gallery',
        route: gallery_routes_1.default,
    },
    {
        path: '/seminars',
        route: seminar_routes_1.SeminarRoutes,
    },
    {
        path: '/admissions',
        route: admission_routes_1.AdmissionRoutes,
    },
    {
        path: '/courses',
        route: course_routes_1.courseRoutes,
    },
    {
        path: '/course-batches',
        route: coursebatch_routes_1.courseBatchRoutes,
    },
    {
        path: '/coupons',
        route: coupon_routes_1.couponRoutes,
    },
    {
        path: '/upload',
        route: upload_routes_1.default,
    },
    {
        path: '/attendances',
        route: attendance_routes_1.attendanceRoutes,
    },
    {
        path: '/student-attendance',
        route: studentAttendance_routes_1.studentAttendanceRoutes,
    },
    {
        path: '/seminar-confirmations',
        route: seminar_confirmation_routes_1.SeminarConfirmationRoutes,
    },
    {
        path: '/review',
        route: review_routes_1.reviewRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
