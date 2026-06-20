import { PostingStatus, type JobPosting } from '@prisma/client';
import { getTestDb } from '../helpers/db';

export function futureCalendarDate(daysFromNow: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type CreateJobOptions = {
  status?: PostingStatus;
  title?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  startTime?: string | null;
  endTime?: string | null;
};

export async function createJobPosting(
  hostProfileId: string,
  options: CreateJobOptions = {},
): Promise<JobPosting> {
  const db = getTestDb();
  const start =
    options.startDate !== undefined
      ? options.startDate
      : new Date(`${futureCalendarDate(30)}T00:00:00.000Z`);
  const end =
    options.endDate !== undefined
      ? options.endDate
      : new Date(`${futureCalendarDate(37)}T00:00:00.000Z`);

  return db.jobPosting.create({
    data: {
      hostProfileId,
      title: options.title ?? 'Integration Test Job',
      description: 'Job created for integration tests',
      servicesRequired: [],
      status: options.status ?? PostingStatus.ACTIVE,
      location: 'Halifax, NS',
      leaveType: 'VACATION',
      fullHalfDay: 'FULL_DAY',
      startDate: start,
      endDate: end,
      startTime: options.startTime ?? null,
      endTime: options.endTime ?? null,
      keyResponsibilities: [],
      requiredCredentials: [],
    },
  });
}

export function buildCreateJobPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'New Host Job',
    description: 'Created via HTTP in integration test',
    location: 'Halifax, NS',
    saveAsDraft: true,
    leaveType: 'VACATION',
    fullHalfDay: 'FULL_DAY',
    startDate: futureCalendarDate(14),
    endDate: futureCalendarDate(21),
    ...overrides,
  };
}
