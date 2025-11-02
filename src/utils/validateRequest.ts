import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

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
