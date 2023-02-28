import { readFile } from "fs/promises";
import { load } from "js-yaml";

import { config as validate } from "./schema";
import { Config } from "./types";

export async function read(path: string): Promise<Config> {
    const buffer = await readFile(path);
    const content = buffer.toString("utf-8");
    try { 
        const config = load(content);
        const isValid = validate(config);
        if (isValid) {
            return config;
        } else {
            throw validate.errors;
        }
    } catch (error) {
        console.log(error)
        throw error;
    }
}