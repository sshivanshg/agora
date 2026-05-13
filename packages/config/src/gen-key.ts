#!/usr/bin/env tsx
import { randomBytes } from "node:crypto";

const key = randomBytes(32).toString("base64");
console.log("\nGenerated INSTANCE_ENCRYPTION_KEY:");
console.log(key);
console.log("\nAdd this to your .env file:");
console.log(`INSTANCE_ENCRYPTION_KEY="${key}"`);
console.log();
