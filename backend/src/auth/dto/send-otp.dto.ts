import { IsEmail, IsIn } from 'class-validator';

export class SendOtpDto {
  @IsEmail()
  email: string;

  @IsIn(['locum', 'clinic'])
  role: 'locum' | 'clinic';
}
