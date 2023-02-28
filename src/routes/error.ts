import { NextFunction, Request, Response } from "express";

export function createErrorHandler() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
        if (error instanceof SyntaxError ) {
            return res.status(400).json({
                msg: error.message
            })
        }

        return res.status(500).json({
            msg: error.message
        })
    }
}