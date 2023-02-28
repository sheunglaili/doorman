import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolve } from "path";

import { GenericContainer, StartedTestContainer } from "testcontainers";
import { DoormanServer } from "../src/server";

import type { Server } from "http";
import type { AddressInfo } from "net";
import { TestClient } from "./utils/test-client";

describe("API key", () => {
    let redis: StartedTestContainer;
    let server: Server;
    let testClient: TestClient;

    beforeAll(async () => {
        process.env.DOORMAN_CONFIG_PATH = resolve(__dirname, "./fixture/");

        redis = await new GenericContainer("redis")
            .withExposedPorts(6379)
            .start();

        process.env.REDIS_PORT = `${redis.getMappedPort(6379)}`

        server = await new DoormanServer().start();

        testClient = new TestClient(`http://localhost:${(server.address() as AddressInfo).port}`);
    })

    afterAll(async () => {
        process.env.DOORMAN_CONFIG_PATH = undefined;
        await redis.stop();
        server.close();
    });

    it("should create api key provided with basic authentication", async () => {
        const { statusCode, body } = await testClient.requestAPIKey(['write:test-permission']);

        expect(statusCode).toEqual(200);
        const { apiKey } = await body.json();

        expect(apiKey).not.empty
    });

    it('should not create api key with not configured permissions', async () => {
        const { statusCode, body } = await testClient.requestAPIKey(['write:not-allowed-permisison']);

        expect(statusCode).toEqual(400);

        const { msg } = await body.json();
        expect(msg).toEqual('Invalid Permission: write:not-allowed-permisison.')
    });

    it('should revoke api key with basic authentication', async () => {
        const { body: createAPIKeyRespBody } = await testClient.requestAPIKey(['write:test-permission']);

        const { apiKey } = await createAPIKeyRespBody.json();

        const { statusCode } = await testClient.revokeAPIKey(apiKey);

        expect(statusCode).toEqual(200);

        const { statusCode: verificationStatusCode, body: verificationRespBody } = await testClient.verifyTokenOrAPIKey(apiKey);

        expect(verificationStatusCode).toEqual(401);

        const { msg } = await verificationRespBody.json();
        expect(msg).toEqual("invalid API Key: Revoked");
    })
})