import { IsString, IsOptional, IsInt, Min } from 'class-validator';
export class SaveLocumProfileDto {
    @IsString()
    firstName!: string;
    @IsString()
    lastName!: string;
    @IsString()
    @IsOptional()
    cpsnsNumber?: string;
    @IsInt()
    @Min(0)
    @IsOptional()
    yearsOfExperience?: number;
    @IsString()
    @IsOptional()
    professionalSummary?: string;
    @IsString()
    @IsOptional()
    specialization?: string;
    @IsString()
    @IsOptional()
    address1?: string;
    @IsString()
    @IsOptional()
    address2?: string;
    @IsString()
    @IsOptional()
    postalCode?: string;
    @IsString()
    @IsOptional()
    city?: string;
    @IsString()
    @IsOptional()
    province?: string;
    @IsString()
    @IsOptional()
    licenseFileName?: string;
    @IsString()
    @IsOptional()
    resumeFileName?: string;
    @IsString()
    @IsOptional()
    extraFileName?: string;
}
export class ApplyJobDto {
    @IsString()
    @IsOptional()
    coverNote?: string;
}
