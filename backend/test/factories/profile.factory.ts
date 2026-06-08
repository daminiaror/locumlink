import { randomUUID } from 'node:crypto';
import {
  BillingType,
  Specialty,
  VerificationStatus,
  type HostProfile,
  type LocumProfile,
} from '@prisma/client';
import { getTestDb } from '../helpers/db';

export async function createVerifiedLocumProfile(
  userId: string,
): Promise<LocumProfile> {
  const db = getTestDb();
  return db.locumProfile.create({
    data: {
      userId,
      cpsnsId: `CPSNS-${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      specialty: Specialty.GENERAL_PRACTICE,
      billingType: BillingType.FEE_FOR_SERVICE,
      cpsnsVerificationStatus: VerificationStatus.VERIFIED,
      cpsnsVerifiedAt: new Date(),
      firstName: 'Test',
      lastName: 'Locum',
      city: 'Halifax',
      province: 'NS',
    },
  });
}

export async function createVerifiedHostProfile(
  userId: string,
): Promise<HostProfile> {
  const db = getTestDb();
  return db.hostProfile.create({
    data: {
      userId,
      practiceName: 'Test Clinic',
      address: '123 Main St',
      city: 'Halifax',
      postalCode: 'B3H1A1',
      province: 'NS',
      servicesOffered: [],
      contactFirstName: 'Host',
      contactLastName: 'User',
      cpsnsVerificationStatus: VerificationStatus.VERIFIED,
      cpsnsVerifiedAt: new Date(),
    },
  });
}
