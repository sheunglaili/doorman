import { request } from "undici";

export class TestClient {
    constructor(private url: string) { }

    async requestAPIKey(permissions: string[]) {
        return request(`${this.url}/api-key`, {
            method: 'POST',
            headers: {
                authorization: `basic ${Buffer.from('admin:doorman', 'utf-8').toString('base64')}`,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                permissions
            })
        });
    }

    async revokeAPIKey(apiKey: string) {
        return request(`${this.url}/api-key`, {
            method: 'DELETE',
            headers: {
                authorization: `basic ${Buffer.from('admin:doorman', 'utf-8').toString('base64')}`,
                'content-type': 'application/json'
            },
            body: JSON.stringify({ apiKey })
        });
    }

    async verifyTokenOrAPIKey(apiKey: string) {
        return request(`${this.url}/token/verify`, {
            method: 'GET',
            query: {
                apiKey
            }
        })
    }

    async issueToken(apiKey: string, permissions: string[], user?: any) {
        return request(`${this.url}/token/issue`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            query: {
                apiKey,
            },
            body: JSON.stringify({
                permissions,
                user
            })
        });
    }
}