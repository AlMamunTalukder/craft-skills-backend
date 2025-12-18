/* eslint-disable @typescript-eslint/consistent-type-imports */
import type { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

const validateRequest =
    (schema: ZodTypeAny) => async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body ? req.body : {});
            return next();
        } catch (err) {
            next(err);
        }
    };

export default validateRequest;

// server/utils/validateRequest.ts
// import type { Request, Response, NextFunction } from 'express';
// import { ZodError } from 'zod';

// const validateRequest = (schema: AnyZodObject) => {
//     return async (req: Request, res: Response, next: NextFunction) => {
//         try {
//             await schema.parseAsync(req.body);
//             next();
//         } catch (error) {
//             if (error instanceof ZodError) {
//                 const errors = error.errors.map((err) => ({
//                     field: err.path.join('.'),
//                     message: err.message,
//                 }));

//                 res.status(400).json({
//                     success: false,
//                     message: 'Validation failed',
//                     errors,
//                 });
//             } else {
//                 next(error);
//             }
//         }
//     };
// };

// export default validateRequest;
