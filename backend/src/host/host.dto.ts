import {
  IsString, IsBoolean, IsArray,
  IsOptional, IsIn,
} from 'class-validator';

// ── Existing profile DTO (unchanged) ──────────────────────────────────────────

export class SaveHostProfileDto {
  @IsString()
  clinicName!: string;

  @IsString() @IsOptional() contactFirstName?: string;
  @IsString() @IsOptional() contactLastName?:  string;
  @IsString() @IsOptional() cpsnsNumber?:      string;
  @IsString() @IsOptional() speciality?:       string;
  @IsString() @IsOptional() address1?:         string;
  @IsString() @IsOptional() address2?:         string;
  @IsString() @IsOptional() postalCode?:       string;
  @IsString() @IsOptional() city?:             string;
  @IsString() @IsOptional() province?:         string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @IsBoolean() @IsOptional() accommodationProvided?: boolean;
  @IsString()  @IsOptional() practiceType?:          string;
  @IsString()  @IsOptional() numPhysicians?:          string;
  @IsString()  @IsOptional() emrSystem?:              string;
  @IsString()  @IsOptional() patientVolume?:          string;
  @IsString()  @IsOptional() clinicDescription?:      string;
}

// ── Job DTOs (matches JobPosting model in schema) ─────────────────────────────

export class CreateJobDto {
  @IsString()
  title!: string;

  @IsString()  @IsOptional() description?:      string;
  @IsString()  @IsOptional() location?:         string;
  @IsString()  @IsOptional() expiresAt?:        string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  servicesRequired?: string[];

  @IsBoolean() @IsOptional() isRural?:               boolean;
  @IsBoolean() @IsOptional() accommodationProvided?:  boolean;
}

export class UpdateJobDto {
  @IsString() @IsOptional() title?:       string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() location?:    string;

  @IsString()
  @IsIn(['DRAFT', 'ACTIVE', 'FILLED', 'CANCELLED', 'EXPIRED'])
  @IsOptional()
  status?: 'DRAFT' | 'ACTIVE' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
}

// ── Application DTO ───────────────────────────────────────────────────────────

export class UpdateApplicationDto {
  @IsString()
  @IsIn(['SHORTLISTED', 'REJECTED', 'CONFIRMED'])
  status!: 'SHORTLISTED' | 'REJECTED' | 'CONFIRMED';
}