import {
  ApplicationStatus,
  type Application,
} from '@prisma/client';
import { getTestDb } from '../helpers/db';

export async function createApplication(params: {
  jobPostingId: string;
  locumProfileId: string;
  status?: ApplicationStatus;
  coverNote?: string;
}): Promise<Application> {
  const db = getTestDb();
  return db.application.create({
    data: {
      jobPostingId: params.jobPostingId,
      locumProfileId: params.locumProfileId,
      status: params.status ?? ApplicationStatus.APPLIED,
      coverNote: params.coverNote ?? null,
    },
  });
}
