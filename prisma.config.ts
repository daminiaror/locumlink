import dotenv from "dotenv";

// Prefer values from repo `.env` over inherited shell env (avoids wrong DB during migrate).
dotenv.config({ path: ".env", override: true });

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "database/prisma/schema.prisma",
  migrations: {
    path: "database/prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
    // Optional: only needed for some `migrate dev` workflows; omit if unset (avoids PrismaConfigEnvError).
    ...(process.env.SHADOW_DATABASE_URL
      ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL }
      : {}),
  },
});
