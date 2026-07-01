import type { ConfigService } from '@nestjs/config';

/**
 * When NODE_ENV=staging and FIXED_OTP_CODE is set to a valid N-digit string,
 * OTP flows use that code and skip outbound email (staging VMs only).
 */
export function getFixedOtpForStaging(
  config: ConfigService,
  otpLength: number,
): string | null {
  const nodeEnv = config.get<string>('NODE_ENV')?.trim();
  if (nodeEnv !== 'staging') return null;

  const raw = config.get<string>('FIXED_OTP_CODE')?.trim();
  if (!raw || !new RegExp(`^\\d{${otpLength}}$`).test(raw)) return null;

  return raw;
}
