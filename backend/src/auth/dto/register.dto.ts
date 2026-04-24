import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsString, Matches, MaxLength, MinLength, } from 'class-validator';
export class RegisterDto {
    @IsEmail()
    email: string;
    @IsString()
    @MinLength(8)
    @MaxLength(64)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+]).{8,}$/, {
        message: 'Password must contain uppercase, lowercase, number, and special character',
    })
    password: string;
    @IsEnum(Role)
    role: Role;
}
