import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createAuth } from "./auth.js";
import { type OwnerEnv, requireOwner } from "./middleware/owner.js";
import { healthRouter } from "./routes/health.js";
import { setupRouter } from "./routes/setup.js";

const enableAuth = process.env.ENABLE_AUTH === "true";
const auth = enableAuth ? createAuth() : null;

const app = new Hono<OwnerEnv>();

app.use(logger());
app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    credentials: true,
  }),
);

app.route("/health", healthRouter);
app.use("/setup/*", requireOwner(auth));
app.route("/setup", setupRouter);

// Auth routes — only mounted when ENABLE_AUTH=true
if (auth) {
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
}

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

const port = Number(process.env.PORT ?? 4000);
console.log(`API server starting on :${port}`);

serve({ fetch: app.fetch, port });
