import { db } from "@agora/db";
import * as schema from "@agora/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";

// Only instantiated when ENABLE_AUTH=true
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createAuth() {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
          // Dev: log to console. Swap for Resend/SMTP in production.
          console.log(`\n[AUTH] Magic link for ${email}:\n${url}\n`);
        },
      }),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
    },
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"],
  });
}

export type Auth = ReturnType<typeof createAuth>;
