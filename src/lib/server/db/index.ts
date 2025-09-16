import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config";

if (!process.env.cecms_POSTGRES_URL) throw new Error("cecms_POSTGRES_URL is not set");

const client = postgres(process.env.cecms_POSTGRES_URL);

export const db = drizzle(client, { schema });
