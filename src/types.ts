import type { ParamsDictionary } from "express-serve-static-core";
import type { Request, Response, NextFunction } from "express";
import type { Authenticator } from "./middlewares/auth";
import type { Validator } from "./middlewares/validate";
import type { BlockList } from "./blocklist";
import type { Permissions } from "./permission";

export type Middleware<T extends Request = Request> = (req: T, res: Response, next: NextFunction) => void;

export type APIPermission = string;

export type CreateAPIKeyParams = {
    expiresIn?: string;

    permissions: APIPermission[]
};

export type RevokeAPIKeyParams = {
    apiKey: string
};

export type IssueTokenParams = {
    expiresIn?: string;

    user: any;
    permissions: APIPermission[]
}

export type RequestWithAPIKey<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = qs.ParsedQs, Locals extends Record<string, any> = Record<string, any>> = {
    apiKey?: string
} & Request<P, ResBody, ReqBody, ReqQuery, Locals>;

export type APIPermissionConfig = {
    id: string,
    // allow only one layer deep
    children?: string[];
}

export type JWTConfig = {
    secret: string
    'api_key_timeout'?: string
    'api_token_timeout': string
}

export type AuthConfig = {
    username: string
    password: string
}

export type Config = {
    auth: AuthConfig;
    jwt: JWTConfig;
    permissions: APIPermissionConfig[]
}

type Middlewares = {
    auth: Authenticator
    validate: Validator
}

export type DoormanContext = {
    config: Config;
    middlewares: Middlewares;
    permissions: Permissions;
    blocklist: BlockList;
}