import { resolve } from "path";

import express from "express";
import pino from "pino-http";

import { createTokenRouter } from "./routes/token";
import { createAPIKeyRouter } from "./routes/api-key";

import { read } from "./config";
import { DoormanContext } from "./types";
import { Authenticator } from "./middlewares/auth";
import { Validator } from "./middlewares/validate";
import { BlockList } from "./blocklist";
import { Permissions } from "./permission";
import Redis from "ioredis";
import { createErrorHandler } from "./routes/error";


export class DoormanServer {
    async initContext(): Promise<DoormanContext> {
        // config
        const config = await read(resolve((process.env.DOORMAN_CONFIG_PATH || "/etc/doorman"), "doorman.yaml"));
        // block list 
        const redis = new Redis({
            username: process.env.REDIS_USERNAME,
            password: process.env.REDIS_PASSWORD,
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || "6379")
        });
        const blocklist = new BlockList(redis);

        // middlewares
        const auth = new Authenticator(config, blocklist);
        const validate = new Validator();

        // permissions
        const permissions = new Permissions(config);

        return {
            config,
            blocklist,
            permissions,
            middlewares: {
                auth,
                validate
            }
        }
    }

    async start() {
        const ctx = await this.initContext();

        const app = express();

        app.use(pino())
        app.use(express.json());
        app.use('/token', createTokenRouter(ctx));
        app.use('/api-key', createAPIKeyRouter(ctx));
        app.use(createErrorHandler());

        return app.listen(parseInt(process.env.PORT || "3000"));
    }
}