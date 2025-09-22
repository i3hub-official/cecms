// // src/lib/server/db/index.ts - Add Edge Runtime check
// import { drizzle } from 'drizzle-orm/vercel-postgres';
// import { sql } from '@vercel/postgres';

// // Check if we're in Edge Runtime
// const isEdgeRuntime = typeof process !== 'undefined' && process.versions != null && process.versions.node == null;

// let db;
// if (!isEdgeRuntime) {
//   // Only initialize database connection in Node.js runtime
//   db = drizzle(sql);
// } else {
//   // Provide a mock or throw error in Edge Runtime
//   db = null;
// }

// export { db };

//================================================================
// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres from "postgres";
// import * as schema from "./schema";
// import "dotenv/config";

// if (!process.env.cecms_POSTGRES_URL) throw new Error("cecms_POSTGRES_URL is not set");

// const client = postgres(process.env.cecms_POSTGRES_URL);

// export const db = drizzle(client, { schema });
//================================================================


// src/lib/server/db/index.ts11
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config";

if (!process.env.cecms_DATABASE_URL) {
  throw new Error("cecms_DATABASE_URL is not set");
}

// Enable pooling (Neon pooler handles this behind the scenes)
const client = postgres(process.env.cecms_DATABASE_URL, {
  max: 10, // max connections (keep it modest for Vercel)
  idle_timeout: 20, // in seconds
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
