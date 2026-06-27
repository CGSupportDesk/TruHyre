import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

function hostOf(value?: string) {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return "invalid-url";
  }
}

function envFlag(value?: string) {
  return {
    present: Boolean(value),
    length: value?.length ?? 0,
  };
}

export async function GET() {
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  const database: {
    configured: boolean;
    ping: "not_checked" | "ok" | "failed";
    usersTable: "not_checked" | "ok" | "failed";
    error?: string;
  } = {
    configured: Boolean(dbUrl),
    ping: "not_checked",
    usersTable: "not_checked",
  };

  if (dbUrl) {
    try {
      const sql = neon(dbUrl);
      await sql`select 1 as ok`;
      database.ping = "ok";
      try {
        await sql`select count(*)::int as count from users`;
        database.usersTable = "ok";
      } catch (e) {
        database.usersTable = "failed";
        database.error = e instanceof Error ? e.message : String(e);
      }
    } catch (e) {
      database.ping = "failed";
      database.error = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    status: "ok",
    auth: {
      AUTH_SECRET: envFlag(process.env.AUTH_SECRET),
      NEXTAUTH_SECRET: envFlag(process.env.NEXTAUTH_SECRET),
      EFFECTIVE_SECRET: {
        present: Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback"),
        source: process.env.AUTH_SECRET ? "AUTH_SECRET" : process.env.NEXTAUTH_SECRET ? "NEXTAUTH_SECRET" : "code_fallback",
      },
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? null,
      AUTH_URL_HOST: hostOf(process.env.AUTH_URL),
      NEXTAUTH_URL_HOST: hostOf(process.env.NEXTAUTH_URL),
      NEXT_PUBLIC_APP_URL_HOST: hostOf(process.env.NEXT_PUBLIC_APP_URL),
      NODE_ENV: process.env.NODE_ENV ?? null,
    },
    database,
    checkedAt: new Date().toISOString(),
  });
}
