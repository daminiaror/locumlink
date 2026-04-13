import { IsIn } from 'class-validator';

/** Matches frontend `Role` before mapping to Prisma `HOST` | `LOCUM`. */
export class SyncSupabaseDto {
  @IsIn(['locum', 'clinic'])
  role: 'locum' | 'clinic';
}
