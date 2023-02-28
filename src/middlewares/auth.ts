import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";

import type { Request, Response, NextFunction } from "express";
import type { APIPermission, Config, Middleware, RequestWithAPIKey } from "../types";
import { BlockList } from "../blocklist";

export class Authenticator {
  constructor(private config: Config, private blocklist: BlockList) {
  }

  private verifyToken(token: string) {
    return jwt.verify(token, this.config.jwt.secret);
  }

  private retrieveAPIKey(req: Request) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || typeof apiKey !== "string") return;

    return this.sanitiseAPIKey(apiKey);
  }

  public sanitiseAPIKey(apiKey: string) {
    return apiKey.substring(3); // substring to remove prefix
  }

  /**
   * Middleware for checking whether claim contains permissions to issue token. 
   * Should **ALWAYS** use behind {@link validToken} to prevent processing a invalid token.
   * 
   * @returns 
   */
  public allowIssueToken(): Middleware<RequestWithAPIKey> {
    return function (req: RequestWithAPIKey, res: Response, next: NextFunction) {
      const apiKey = req.apiKey || ""; // assume api key exists  
      const claims = jwt.decode(apiKey) as JwtPayload;

      const tokenPermission: APIPermission[] = claims['permissions'];
      if (!tokenPermission.includes('issue:api_token')) {
        return res.status(401).json({
          "msg": "API Key is not authorised to issue API token"
        })
      }

      next();
    }
  }

  /**
   * Middleware for validating token.
   * 
   * @returns 
   */
  public validToken(): Middleware {
    return async (req: Request, res: Response, next: NextFunction) => {
      const apiKey = this.retrieveAPIKey(req);
      if (!apiKey) return res.status(401).json({ msg: "API Key is missing or malformed" });
      try {
        const claims = this.verifyToken(apiKey);
        // should always be Jwt.Payload as we create the claims with object
        if (typeof claims === "string") return res.status(401).json({ msg: "API Key is missing or malformed" });

        const isRevoked = await this.blocklist.isRevoked(apiKey);
        if (isRevoked) return res.status(401).json({ msg: "invalid API Key: Revoked" });

          // set api key into request object
          (req as RequestWithAPIKey).apiKey = apiKey;

        next();
      } catch (err) {
        if (err instanceof JsonWebTokenError) {
          return res.status(401).json({
            "msg": `invalid API Key: ${err.message}`
          })
        }
      }
    }
  }

  /**
   * Middleware for validating whether requests are called with admin credentials 
   * 
   * @returns 
   */
  public isAdmin(): Middleware {
    return (req: Request, res: Response, next: NextFunction) => {
      const authorisation = req.headers.authorization;
      if (!authorisation) {
        return res.status(401).json({
          msg: "Missing Credential"
        });
      }

      const [type, creds] = authorisation.split(" ");
      if (type.toLowerCase() !== 'basic') {
        return res.status(401).json({
          msg: `Unsupported Authentication type: ${type}`
        });
      }

      if (!creds || creds.length === 0) {
        return res.status(401).json({
          msg: "Missing Credential"
        });
      }

      const decodedCreds = Buffer.from(creds, 'base64').toString('utf-8');
      const [username, password] = decodedCreds.split(":");

      if (username !== this.config.auth.username || password !== this.config.auth.password) {
        return res.status(401).json({
          msg: "Invalid credential"
        })
      }

      next();
    }
  }
}
