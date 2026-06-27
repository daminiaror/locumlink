import { IsIn, IsNotEmpty, IsString } from 'class-validator';
export class SyncSupabaseDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['locum', 'clinic'])
  role!: 'locum' | 'clinic';
}
