"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("../config/index"));
const http_status_1 = __importDefault(require("http-status"));
const handleZodError_1 = __importDefault(require("../errors/handleZodError"));
const zod_1 = require("zod");
const errorHandler = (err, _req, res, _next) => {
    const statusCode = http_status_1.default.INTERNAL_SERVER_ERROR;
    const success = false;
    let message = err.message || 'Something went wrong!';
    let errors = err;
    if (err instanceof zod_1.ZodError) {
        message = 'Please provide valid data!';
        errors = (0, handleZodError_1.default)(err);
    }
    else if (err.code === 11000) {
        message = 'Duplicate field value entered';
        errors = {
            [Object.keys(err.keyValue)[0]]: `${Object.keys(err.keyValue)[0]} already exists`,
        };
    }
    else if (err?.name === 'ValidationError') {
        message = 'Please provide valid data!';
        errors = err.errors;
    }
    else if (err?.name === 'CastError') {
        message = `Resource not found with id of ${err.value}`;
        errors = {};
    }
    return res.status(statusCode).json({
        success,
        message,
        errors,
        stack: index_1.default.env === 'development' ? err?.stack : null,
    });
};
exports.default = errorHandler;
