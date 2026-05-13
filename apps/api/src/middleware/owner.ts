import type { MiddlewareHandler } from "hono";
import type { Auth } from "../auth.js";

export type Owner = { id: string | null; role: "owner" };

export type OwnerEnv = {
  Variables: {
    owner: Owner;
  };
};

// In single-user mode: every request is automatically owner-scoped.
// In multi-user mode: validates session and checks role=owner.
export function requireOwner(auth: Auth | null): MiddlewareHandler {
  return async (c, next) => {
    const singleUser = process.env.SINGLE_USER_MODE !== "false";
    if (singleUser) {
      c.set("owner", { id: null as string | null, role: "owner" as const });
      await next();
      return;
    }
    if (!auth) {
      c.res = c.json({ error: "Auth not configured" }, 503);
      return;
    }
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      c.res = c.json({ error: "Unauthorized" }, 401);
      return;
    }
    if ((session.user as { role?: string }).role !== "owner") {
      c.res = c.json({ error: "Forbidden" }, 403);
      return;
    }
    c.set("owner", { id: session.user.id, role: "owner" as const });
    await next();
  };
}
