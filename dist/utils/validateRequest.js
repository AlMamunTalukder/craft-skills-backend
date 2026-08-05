"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validateRequest = (schema) => async (req, res, next) => {
    try {
        req.body = await schema.parseAsync(req.body ? req.body : {});
        return next();
    }
    catch (err) {
        next(err);
    }
};
exports.default = validateRequest;
