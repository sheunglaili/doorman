import { Redis } from "ioredis";
import jwt, { JwtPayload } from "jsonwebtoken";
import { TTLSet } from "./ttlset";

export class BlockList {

    private cache: TTLSet<string>;

    constructor(private redis: Redis) {
        this.cache = new TTLSet(1000 * 60 * 5);
    }

    async revokeAPIKey(apiKey: string) {
        // assume key is validated 
        const claims = jwt.decode(apiKey) as JwtPayload;
        // no need to revoke expired api key
        if (claims.exp && claims.exp < Date.now()) return;

        if (this.cache.has(apiKey)) return;

        await this.redis.set(apiKey, "revoked");
        this.cache.add(apiKey);
    }

    async isRevoked(apiKey: string) {
        if (this.cache.has(apiKey)) return true;

        const result = await this.redis.get(apiKey);
        
        // to populate local cache.
        if (result === "revoked") {
            this.cache.add(apiKey);
        }
        return result === "revoked";
    }
}