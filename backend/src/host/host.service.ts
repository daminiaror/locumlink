import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService }      from '../prisma/prisma.service.js';
import { SaveHostProfileDto, CreateJobDto, UpdateJobDto } from './host.dto.js';

@Injectable()
export class HostService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Profile (unchanged from your original) ─────────────────────────────────

  private toHostProfileData(userId: string, dto: SaveHostProfileDto) {
    const address =
      [dto.address1, dto.address2].filter(Boolean).join(', ').trim() || 'Address pending';
    return {
      userId,
      practiceName: dto.clinicName,
      address,
      city:             dto.city            ?? '',
      postalCode:       dto.postalCode      ?? '',
      province:         dto.province        ?? 'NS',
      servicesOffered:  dto.amenities       ?? [],
      highlights:       dto.clinicDescription ?? null,
      phone:            null as string | null,
      website:          null as string | null,
      ruralDesignation: null as string | null,
      contactFirstName:     dto.contactFirstName?.trim() || null,
      contactLastName:      dto.contactLastName?.trim() || null,
      cpsnsNumber:          dto.cpsnsNumber?.trim() || null,
      speciality:           dto.speciality?.trim() || null,
      address1:             dto.address1?.trim() || null,
      address2:             dto.address2?.trim() || null,
      accommodationProvided: dto.accommodationProvided ?? false,
      practiceType:         dto.practiceType?.trim() || null,
      numPhysicians:        dto.numPhysicians?.trim() || null,
      emr:                  dto.emrSystem?.trim() || null,
      patientVol:           dto.patientVolume?.trim() || null,
    };
  }

  async saveProfile(userId: string, dto: SaveHostProfileDto) {
    const data = this.toHostProfileData(userId, dto);
    const { userId: _uid, ...update } = data;
    const profile = await this.prisma.hostProfile.upsert({
      where:  { userId },
      create: data,
      update,
    });
    return { success: true, profile };
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.hostProfile.findUnique({
      where: { userId },
    });
    if (!profile) return { exists: false, profile: null };
    return { exists: true, profile };
  }

  // ── Jobs (uses JobPosting model from schema) ───────────────────────────────

  /** Get the HostProfile.id (cuid) from userId — needed for JobPosting relation */
  private async getHostProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.hostProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Host profile not found. Please complete your profile first.');
    return profile.id;
  }

  async createJob(userId: string, dto: CreateJobDto) {
    const hostProfileId = await this.getHostProfileId(userId);
    const job = await this.prisma.jobPosting.create({
      data: {
        hostProfileId,
        title:            dto.title,
        description:      dto.description      ?? '',
        servicesRequired: dto.servicesRequired ?? [],
        status:           'ACTIVE',
        location:         dto.location         ?? '',
        isRural:          dto.isRural          ?? false,
        accommodationProvided: dto.accommodationProvided ?? false,
        expiresAt:        dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
    return { success: true, job };
  }

  async getJobs(userId: string) {
    const hostProfileId = await this.getHostProfileId(userId);
    const jobs = await this.prisma.jobPosting.findMany({
      where:   { hostProfileId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { applications: true } },
        shifts: true,
      },
    });
    return {
      jobs: jobs.map(j => ({
        ...j,
        applicationsCount: j._count.applications,
      })),
    };
  }

  async getJob(userId: string, jobId: string) {
    const hostProfileId = await this.getHostProfileId(userId);
    const job = await this.prisma.jobPosting.findUnique({
      where:   { id: jobId },
      include: {
        _count: { select: { applications: true } },
        shifts: true,
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.hostProfileId !== hostProfileId) throw new ForbiddenException();
    return { job: { ...job, applicationsCount: job._count.applications } };
  }

  async updateJob(userId: string, jobId: string, dto: UpdateJobDto) {
    const hostProfileId = await this.getHostProfileId(userId);
    const job = await this.prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.hostProfileId !== hostProfileId) throw new ForbiddenException();

    const updated = await this.prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        ...(dto.title            != null && { title:       dto.title }),
        ...(dto.description      != null && { description: dto.description }),
        ...(dto.status           != null && { status:      dto.status }),
        ...(dto.location         != null && { location:    dto.location }),
      },
    });
    return { success: true, job: updated };
  }

  async deleteJob(userId: string, jobId: string) {
    const hostProfileId = await this.getHostProfileId(userId);
    const job = await this.prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.hostProfileId !== hostProfileId) throw new ForbiddenException();
    await this.prisma.jobPosting.delete({ where: { id: jobId } });
    return { success: true };
  }

  // ── Applications ───────────────────────────────────────────────────────────

  async getApplications(userId: string, jobId: string) {
    const hostProfileId = await this.getHostProfileId(userId);
    const job = await this.prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.hostProfileId !== hostProfileId) throw new ForbiddenException();

    const applications = await this.prisma.application.findMany({
      where:   { jobPostingId: jobId },
      orderBy: { appliedAt: 'desc' },
      include: {
        locumProfile: {
          select: {
            id: true,
            specialty: true,
            summary: true,
            user: { select: { email: true } },
          },
        },
      },
    });
    return { applications };
  }

  async updateApplication(
    userId: string,
    jobId: string,
    appId: string,
    status: 'SHORTLISTED' | 'REJECTED' | 'CONFIRMED',
  ) {
    const hostProfileId = await this.getHostProfileId(userId);
    const job = await this.prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.hostProfileId !== hostProfileId) throw new ForbiddenException();

    const updated = await this.prisma.application.update({
      where: { id: appId },
      data:  { status },
    });

    if (status === 'CONFIRMED') {
      await this.prisma.jobPosting.update({
        where: { id: jobId },
        data:  { status: 'FILLED' },
      });
    }
    return { success: true, application: updated };
  }
}