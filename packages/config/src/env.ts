import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  INSTANCE_ENCRYPTION_KEY: z.string().min(1),
  SINGLE_USER_MODE: z.coerce.boolean().default(true),
  ENABLE_AUTH: z.coerce.boolean().default(false),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
  TELEMETRY_ENABLED: z.coerce.boolean().default(false),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

export const env = parsed.success
  ? parsed.data
  : ({
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      INSTANCE_ENCRYPTION_KEY: process.env.INSTANCE_ENCRYPTION_KEY ?? "",
      SINGLE_USER_MODE: true,
      ENABLE_AUTH: false,
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_API_URL: "http://localhost:4000",
      TELEMETRY_ENABLED: false,
    } as z.infer<typeof schema>);

// Runtime invariant: ENABLE_AUTH=true requires SINGLE_USER_MODE=false
if (env.ENABLE_AUTH && env.SINGLE_USER_MODE) {
  throw new Error(
    "Configuration error: ENABLE_AUTH=true requires SINGLE_USER_MODE=false. " +
      "You cannot enable auth in single-user mode.",
  );
}
