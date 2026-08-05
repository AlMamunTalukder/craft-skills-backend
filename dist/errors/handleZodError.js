"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const handleZodError = (error) => {
    return error.issues.map((issue) => {
        const pathArray = issue.path
            .filter((part) => part !== 'body')
            .map((part) => part.toString());
        const capitalizedPath = pathArray.length > 0
            ? pathArray.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('.')
            : '';
        const errorMessage = issue.message
            ? issue.message.charAt(0).toUpperCase() + issue.message.slice(1).toLowerCase()
            : 'Invalid';
        return {
            path: pathArray[pathArray.length - 1] || '',
            message: (0, lodash_1.trim)(`${capitalizedPath} ${errorMessage}`),
        };
    });
};
exports.default = handleZodError;
