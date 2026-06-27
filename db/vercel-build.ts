import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;

function run(command: string, args: string[]) {
  const ext = process.platform === "win32" ? ".cmd" : "";
  const localBin = join(process.cwd(), "node_modules", ".bin", `${command}${ext}`);
  const bin = existsSync(localBin) ? localBin : command;
  const result =
    process.platform === "win32" && bin.endsWith(".cmd")
      ? spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/c", "call", bin, ...args], {
          stdio: "inherit",
        })
      : spawnSync(bin, args, {
          stdio: "inherit",
        });

  if (result.status !== 0) {
    if (result.error) console.error(`[vercel-build] ${command} failed`, result.error);
    process.exit(result.status ?? 1);
  }
}

if (dbUrl) {
  run("tsx", ["db/fix-types.ts"]);
  run("drizzle-kit", ["push", "--force"]);
  run("tsx", ["db/seed.ts"]);
} else {
  console.log("[vercel-build] no database URL set; skipping migration and seed");
}

run("next", ["build"]);
