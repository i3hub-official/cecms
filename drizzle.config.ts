import { defineConfig } from "drizzle-kit";

if (!process.env.cecms_POSTGRES_URL)
  throw new Error("cecms_POSTGRES_URL is not set");

export default defineConfig({
  schema: "./src/lib/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.cecms_POSTGRES_URL! },
  verbose: true,
  strict: true,
});

// export default defineConfig({
//   schema: "./schema.ts",
//   out: "./drizzle",
//   dialect: "postgresql",
//   dbCredentials: {
//     host: process.env.DB_HOST!, // e.g., accelerate.prisma.io
//     port: Number(process.env.DB_PORT!), // usually 5432
//     user: process.env.DB_USER!, // your username or token
//     password: process.env.DB_PASSWORD!, // your password or token
//     database: process.env.DB_NAME!, // database name
//     ssl: {
//       rejectUnauthorized: false, // required for cloud DBs like Prisma
//     },
//   },
// });
