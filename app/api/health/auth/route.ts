import { NextResponse } from "next/server";
import { checkAuthDatabase } from "@/lib/auth-diagnostics";

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
  const database = await checkAuthDatabase();

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
    seed: {
      SEED_PASSWORD: envFlag(process.env.SEED_PASSWORD),
      SEED_RESET: process.env.SEED_RESET ?? null,
    },
    database,
    checkedAt: new Date().toISOString(),
  });
}
