import { Hono } from "hono";

export const healthRouter = new Hono();

healthRouter.get("/", (c) => {
  const singleUser = process.env.SINGLE_USER_MODE !== "false";
  const authEnabled = process.env.ENABLE_AUTH === "true";
  return c.json({
    status: "ok",
    time: new Date().toISOString(),
    mode: singleUser ? "single_user" : "multi_user",
    authEnabled,
  });
});
