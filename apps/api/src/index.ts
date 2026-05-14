import { loadPersonasFromDisk, syncPersonasToDb } from "@agora/personas";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createAuth } from "./auth.js";
import { registerDailyDebateCron } from "./cron/daily-debate.js";
import { registerNewsCrons } from "./cron/news.js";
import { type OwnerEnv, requireOwner } from "./middleware/owner.js";
import { costsRouter } from "./routes/costs.js";
import { debatesRouter } from "./routes/debates.js";
import { healthRouter } from "./routes/health.js";
import { newsRouter } from "./routes/news.js";
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
app.use("/debates/*", requireOwner(auth));
app.route("/debates", debatesRouter);
app.use("/costs/*", requireOwner(auth));
app.route("/costs", costsRouter);
app.use("/news/*", requireOwner(auth));
app.route("/news", newsRouter);

// Auth routes — only mounted when ENABLE_AUTH=true
if (auth) {
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
}

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

// Reconcile personas on every boot. Idempotent.
(async () => {
  try {
    const personas = loadPersonasFromDisk();
    const result = await syncPersonasToDb(personas);
    console.log(
      `[personas] synced — created=${result.created.length} updated=${result.updated.length} skipped=${result.skipped.length}`,
    );
  } catch (err) {
    console.error("[personas] sync failed:", err);
  }
})();

// Cron jobs — in-process for OSS single-instance mode.
// TODO: move to a worker process in a future hosted-mode phase.
try {
  registerNewsCrons();
  registerDailyDebateCron();
} catch (err) {
  console.error("[cron] registration failed:", err);
}

const port = Number(process.env.PORT ?? 4000);
console.log(`API server starting on :${port}`);

serve({ fetch: app.fetch, port });
