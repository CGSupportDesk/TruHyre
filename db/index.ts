import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
const missingDatabase = () => {
  throw new Error("POSTGRES_URL or DATABASE_URL must be set");
};

const sql = url ? neon(url) : (missingDatabase as unknown as ReturnType<typeof neon>);
export const db = drizzle(sql, { schema });
export { schema };
