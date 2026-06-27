import { neon } from "@neondatabase/serverless";

export type AuthDatabaseHealth = {
  configured: boolean;
  ping: "not_checked" | "ok" | "failed";
  usersTable: "not_checked" | "ok" | "failed";
  seedAdmin: "not_checked" | "ok" | "missing" | "failed";
  userCount?: number;
  error?: string;
};

export function getDatabaseUrl() {
  return process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
}

export async function checkAuthDatabase(): Promise<AuthDatabaseHealth> {
  const dbUrl = getDatabaseUrl();
  const database: AuthDatabaseHealth = {
    configured: Boolean(dbUrl),
    ping: "not_checked",
    usersTable: "not_checked",
    seedAdmin: "not_checked",
  };

  if (!dbUrl) return database;

  try {
    const sql = neon(dbUrl);
    await sql`select 1 as ok`;
    database.ping = "ok";

    try {
      const usersResult = await sql`select count(*)::int as count from users`;
      database.usersTable = "ok";
      database.userCount = Number(usersResult[0]?.count ?? 0);

      const adminResult = await sql`
        select count(*)::int as count
        from users
        where email = 'admin@truhyre.app'
          and is_active = true
      `;
      database.seedAdmin = Number(adminResult[0]?.count ?? 0) > 0 ? "ok" : "missing";
    } catch (e) {
      database.usersTable = "failed";
      database.seedAdmin = "failed";
      database.error = e instanceof Error ? e.message : String(e);
    }
  } catch (e) {
    database.ping = "failed";
    database.error = e instanceof Error ? e.message : String(e);
  }

  return database;
}

export async function getLoginSetupError() {
  const database = await checkAuthDatabase();

  if (!database.configured) {
    return "Login is not ready yet: the production database URL is missing.";
  }
  if (database.ping === "failed") {
    return "Login is not ready yet: the app cannot connect to the production database.";
  }
  if (database.usersTable === "failed") {
    return "Login is not ready yet: database tables are missing. Redeploy after setting the database URL.";
  }
  if (database.usersTable === "ok" && (database.userCount ?? 0) === 0) {
    return "Login is not ready yet: no users have been seeded. Set SEED_PASSWORD and redeploy.";
  }

  return null;
}
