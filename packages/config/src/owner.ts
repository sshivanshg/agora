export interface Owner {
  id: string | null;
  role: "owner";
}

// In single-user mode: the instance itself is the owner, no user row needed.
// In multi-user mode: resolves the authenticated session.
// This is a thin abstraction now; auth integration happens when ENABLE_AUTH=true.
export async function getOwner(): Promise<Owner> {
  const singleUserMode = process.env.SINGLE_USER_MODE !== "false";

  if (singleUserMode) {
    return { id: null, role: "owner" };
  }

  // Multi-user mode: auth resolution is injected at the API layer
  // to avoid circular deps between config and the auth library.
  // The API layer calls getAuthenticatedOwner(req) instead.
  throw new Error(
    "getOwner() called in multi-user mode without a request context. " +
      "Use getAuthenticatedOwner(req) from apps/api instead.",
  );
}
