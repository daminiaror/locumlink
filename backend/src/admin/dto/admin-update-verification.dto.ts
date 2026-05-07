import { VerificationStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

export class AdminUpdateVerificationDto {
    @IsIn([VerificationStatus.VERIFIED, VerificationStatus.REJECTED])
    verificationStatus!: VerificationStatus.VERIFIED | VerificationStatus.REJECTED;
}
