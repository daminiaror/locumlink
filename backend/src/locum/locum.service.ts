import { Injectable } from '@nestjs/common';
import { Specialty } from '@prisma/client';
import { PrismaService }       from '../prisma/prisma.service.js';
import { SaveLocumProfileDto } from './locum.dto.js';

function mapSpecialty(raw?: string): Specialty {
  if (!raw?.trim()) return Specialty.OTHER;
  const key = raw
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return (Specialty as Record<string, Specialty>)[key] ?? Specialty.OTHER;
}

@Injectable()
export class LocumService {
  constructor(private readonly prisma: PrismaService) {}

  async saveProfile(userId: string, dto: SaveLocumProfileDto) {
    const cpsnsId = dto.cpsnsNumber?.trim() || `pending-${userId}`;
    const specialty = mapSpecialty(dto.specialization);
    const summary = dto.professionalSummary ?? null;

    const profile = await this.prisma.locumProfile.upsert({
      where: { userId },
      create: {
        userId,
        cpsnsId,
        specialty,
        summary,
      },
      update: {
        ...(dto.cpsnsNumber?.trim() ? { cpsnsId: dto.cpsnsNumber.trim() } : {}),
        specialty,
        summary,
      },
    });
    return { success: true, profile };
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.locumProfile.findUnique({
      where: { userId },
    });
    return { exists: !!profile, profile: profile ?? null };
  }
}
