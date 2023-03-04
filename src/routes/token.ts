import { Router, Request } from "express";
import jwt from "jsonwebtoken";

import { issueToken } from "../schema";
import { DoormanContext, IssueTokenParams } from "../types";

export function createTokenRouter(ctx: DoormanContext) {
    const router = Router();

    const { config, middlewares, permissions } = ctx;
    const { auth, validate } = middlewares;

    router.post("/issue", auth.validToken(), auth.allowIssueToken(), validate.body(issueToken), (req: Request<{},{}, IssueTokenParams>, res) => {
        const { expiresIn = config.jwt.api_token_timeout, permissions: requestPermissions, ...payload } = req.body;

        // prevent user from issuing api token with the permission to issue new api token
        // to prevent security risk of issuing sudo token
        const denied = permissions.user.allow(...requestPermissions);
        if (denied && denied.length > 0) {
            return res.status(400).json({
                msg: `API Token are not allowed to contains ${denied.join(", ")}`
            })
        }

        // sign the token with provided api key
        const token = jwt.sign({
            permissions: requestPermissions,
            ...payload
        }, config.jwt.secret, { expiresIn });

        // issue a token
        res.status(200).send({
            // prefix with pk_ to indicate this is publishable
            token: `pk_${token}`
        });
    });

    router.get("/verify", auth.validToken(), (req, res) => {
        // only valid token will reach here
        res.status(200).send();
    });

    return router;
}