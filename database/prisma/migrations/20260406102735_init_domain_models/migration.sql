-- NOTE:
-- This migration was superseded by earlier schema work (`20260401080408_init`)
-- and was causing Prisma shadow database validation failures due to duplicate
-- enums/tables/indexes. It is intentionally kept as a no-op to preserve the
-- migration history without breaking `prisma migrate dev`.

SELECT 1;
