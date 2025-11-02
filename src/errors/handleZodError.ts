import type { ZodError } from 'zod';
import { trim } from 'lodash';

const handleZodError = (error: ZodError): any => {
    return error.issues.map((issue) => {
        const pathArray = issue.path
            .filter((part) => part !== 'body')
            .map((part) => part.toString());

        const capitalizedPath =
            pathArray.length > 0
                ? pathArray.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('.')
                : '';

        const errorMessage = issue.message
            ? issue.message.charAt(0).toUpperCase() + issue.message.slice(1).toLowerCase()
            : 'Invalid';

        return {
            path: pathArray[pathArray.length - 1] || '',
            message: trim(`${capitalizedPath} ${errorMessage}`),
        };
    });
};

export default handleZodError;
