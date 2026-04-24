import dotenv from "dotenv";
dotenv.config({ path: ".env", override: true });
import { defineConfig, env } from "prisma/config";
export default defineConfig({
    schema: "database/prisma/schema.prisma",
    migrations: {
        path: "database/prisma/migrations",
    },
    datasource: {
        url: env("DATABASE_URL"),
        ...(process.env.SHADOW_DATABASE_URL
            ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL }
            : {}),
    },
});
