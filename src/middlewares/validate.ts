import { ValidateFunction } from "ajv"
import type { Request, Response, NextFunction } from "express"
import type { Middleware } from "../types";


export class Validator {
    body<T = unknown>(validateFn: ValidateFunction<T>): Middleware {
        return function (req: Request, res: Response, next: NextFunction) {
            const isValid = validateFn(req.body);
            if (isValid) {
                next();
            } else {
                res.status(400)
                    .json({
                        errors: validateFn.errors
                    });
            }
        }
    }
}