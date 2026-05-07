import { Role, UserStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class AdminUpdateUserDto {
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}
