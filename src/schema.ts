import Ajv, { ValidateFunction } from "ajv";
import { Config, CreateAPIKeyParams, IssueTokenParams, RevokeAPIKeyParams } from "./types";

import schema_create_api_key from "./schemas/create_api_key.json";
import schema_revoke_api_key from "./schemas/revoke_api_key.json";
import schema_issue_token from "./schemas/issue_token.json";
import schema_config from "./schemas/config.json";


const ajv = new Ajv({ useDefaults: true });

export const createAPIKey: ValidateFunction<CreateAPIKeyParams> = ajv.compile<CreateAPIKeyParams>(schema_create_api_key);

export const revokeAPIKey: ValidateFunction<RevokeAPIKeyParams> = ajv.compile<RevokeAPIKeyParams>(schema_revoke_api_key);

export const issueToken: ValidateFunction<IssueTokenParams> = ajv.compile<IssueTokenParams>(schema_issue_token);

export const config: ValidateFunction<Config> = ajv.compile<Config>(schema_config);