import jwt from "jsonwebtoken";
import { Router } from "express";

import { createAPIKey, revokeAPIKey } from "../schema";

import type { Request } from "express";
import type { CreateAPIKeyParams, RevokeAPIKeyParams, DoormanContext } from "../types";

export function createAPIKeyRouter(ctx: DoormanContext) {
    const router = Router();

    const { config, middlewares, blocklist, permissions } = ctx;
    const { auth, validate } = middlewares;

    router.post("/", auth.isAdmin(), validate.body(createAPIKey), (req: Request<{}, {}, CreateAPIKeyParams>, res) => {

        const denied = permissions.admin.allow(...req.body.permissions);
        if (denied && denied.length > 0) {
            return res.status(400).json({
                msg: `Invalid Permission: ${denied.join(", ")}.`
            })
        }

        const { expiresIn = config.jwt['api_key_timeout'], ...payload } = req.body;

        // if api key doesn't contains issue:api_token permission 
        // it will be publishable
        const apiKeyType = payload.permissions.includes('issue:api_token') ? 'sk' : 'pk';

        return res.json({
            // prefix with sk_ to indicate this is secret key
            apiKey: `${apiKeyType}_${jwt.sign(payload, config.jwt.secret, {
                ...(expiresIn && { expiresIn }) // workaround for passing undefined expiresIn will throw error
            })}`
        })
    });

    router.delete("/", auth.isAdmin(), validate.body(revokeAPIKey), async (req: Request<{}, {}, RevokeAPIKeyParams>, res) => {
        const { apiKey } = req.body;
        const sanitised = auth.sanitiseAPIKey(apiKey);
        await blocklist.revokeAPIKey(sanitised);
        return res.status(200).send();
    });

    return router;
}