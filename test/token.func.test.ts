import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolve } from "path";

import { GenericContainer, StartedTestContainer } from "testcontainers";
import { DoormanServer } from "../src/server";

import type { Server } from "http";
import type { AddressInfo } from "net";
import { TestClient } from "./utils/test-client";

describe("token", () => {
    
    let redis: StartedTestContainer;
    let server: Server;
    let testClient: TestClient;

    beforeAll(async () => {
        process.env.DOORMAN_CONFIG_PATH = resolve(__dirname, "./fixture/");
        process.env.PORT = "0";

        redis = await new GenericContainer("redis")
            .withExposedPorts(6379)
            .start();

        server = await new DoormanServer().start();

        testClient = new TestClient(`http://localhost:${(server.address() as AddressInfo).port}`);
    })

    afterAll(async () => {
        process.env.DOORMAN_CONFIG_PATH = undefined;
        await redis.stop();
        server.close();
    });

    it('should be able to issue token with secert api key', async () => {
        const { body: createAPIKeyRespBody } = await testClient.requestAPIKey(['issue:api_token']);
        const { apiKey } = await createAPIKeyRespBody.json();

        const { statusCode, body: issueTokenRespBody } = await testClient.issueToken(apiKey, ['write:test-permission'], {});

        expect(statusCode).toEqual(200);

        const { token } = await issueTokenRespBody.json();

        expect(token).not.empty;
    });

    it('should not be able to issue token with issue:api_token permission', async () => {
        const { body: createAPIKeyRespBody } = await testClient.requestAPIKey(['issue:api_token']);
        const { apiKey } = await createAPIKeyRespBody.json();

        const { statusCode, body: issueTokenRespBody } = await testClient.issueToken(apiKey, ['issue:api_token'], {});

        expect(statusCode).toEqual(400);

        const { msg } = await issueTokenRespBody.json();

        expect(msg).toEqual("API Token are not allowed to contains issue:api_token");
    });

    it('should be able to verify secret api key', async () => {
        const { body: createAPIKeyRespBody } = await testClient.requestAPIKey(['issue:api_token']);
        const { apiKey } = await createAPIKeyRespBody.json();

        const { statusCode } = await testClient.verifyTokenOrAPIKey(apiKey);

        expect(statusCode).toEqual(200);
    });

    it('should be able to verify api token', async () => {
        const { body: createAPIKeyRespBody } = await testClient.requestAPIKey(['issue:api_token']);
        const { apiKey } = await createAPIKeyRespBody.json();

        const { body: issueTokenRespBody } = await testClient.issueToken(apiKey, ['write:test-permission'], {});

        const { token } = await issueTokenRespBody.json();

        const { statusCode } = await testClient.verifyTokenOrAPIKey(token);

        expect(statusCode).toEqual(200);
    })
})