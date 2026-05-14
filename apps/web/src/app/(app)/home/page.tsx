import { db, instanceConfig } from "@agora/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export const metadata = { title: "Home" };

export default async function HomePage() {
  const [setup] = await db
    .select()
    .from(instanceConfig)
    .where(eq(instanceConfig.key, "setup_completed"))
    .limit(1);
  if (!setup || setup.value !== true) redirect("/setup");
  redirect("/today");
}
