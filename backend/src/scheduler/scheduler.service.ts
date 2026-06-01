import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifService: NotificationsService,
  ) {}

  // L-005: 48h before shift
  @Cron(CronExpression.EVERY_HOUR)
  async handleShiftReminders() {
    try {
      const now = new Date();
      const confirmedApps = await this.prisma.application.findMany({
        where: { status: 'CONFIRMED', jobPosting: { startDate: { not: null } } },
        include: {
          locumProfile: { select: { userId: true } },
          jobPosting: { select: { id: true, title: true, startDate: true, startTime: true, hostProfile: { select: { practiceName: true, address: true } } } },
        },
      });

      for (const app of confirmedApps) {
        if (!app.jobPosting.startDate) continue;
        const diffH = (new Date(app.jobPosting.startDate).getTime() - now.getTime()) / 3600000;
        const clinicName = app.jobPosting.hostProfile?.practiceName ?? 'the clinic';
        const dateStr = new Date(app.jobPosting.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        const timeStr = app.jobPosting.startTime ?? '';

        // L-005: 48h reminder
        if (diffH >= 47 && diffH < 48) {
          await this.notifService.create({
            recipientId: app.locumProfile.userId,
            eventType: 'L_005_SHIFT_REMINDER_48H',
            title: `Upcoming Shift Reminder — ${dateStr}`,
            body: `Your shift at ${clinicName} starts in 2 days on ${dateStr}${timeStr ? ' at ' + timeStr : ''}.`,
            href: '/locum/dashboard',
            referenceId: app.id,
            referenceType: 'Application',
          });
        }

        // L-007: 2h reminder
        if (diffH >= 1 && diffH < 2) {
          await this.notifService.create({
            recipientId: app.locumProfile.userId,
            eventType: 'L_007_SHIFT_REMINDER_2H',
            title: `Your shift starts in 2 hours at ${clinicName}`,
            body: `Safe travels! Your shift at ${clinicName} starts at ${timeStr || 'the scheduled time'}.`,
            href: '/locum/dashboard',
            referenceId: app.id,
            referenceType: 'Application',
          });
        }
      }
    } catch (err) { this.logger.error('Shift reminder cron failed', err); }
  }

  // L-006: Evening before shift (8 PM)
  @Cron('0 20 * * *')
  async handleEveningReminders() {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      const confirmedApps = await this.prisma.application.findMany({
        where: { status: 'CONFIRMED', jobPosting: { startDate: { not: null } } },
        include: {
          locumProfile: { select: { userId: true } },
          jobPosting: { select: { id: true, title: true, startDate: true, startTime: true, hostProfile: { select: { practiceName: true, address: true } } } },
        },
      });

      for (const app of confirmedApps) {
        if (!app.jobPosting.startDate) continue;
        if (new Date(app.jobPosting.startDate).toISOString().slice(0, 10) !== tomorrowStr) continue;
        const clinicName = app.jobPosting.hostProfile?.practiceName ?? 'the clinic';
        const timeStr = app.jobPosting.startTime ?? '';

        await this.notifService.create({
          recipientId: app.locumProfile.userId,
          eventType: 'L_006_SHIFT_REMINDER_EVENING',
          title: `Tomorrow: Shift at ${clinicName}`,
          body: `Your shift begins tomorrow${timeStr ? ' at ' + timeStr : ''}. Ensure you have all credentials ready.`,
          href: '/locum/dashboard',
          referenceId: app.id,
          referenceType: 'Application',
        });
      }
    } catch (err) { this.logger.error('Evening reminder cron failed', err); }
  }

  // H-008: Posting expiring in 48h
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiryReminders() {
    try {
      const now = new Date();
      const in47h = new Date(now.getTime() + 47 * 3600000);
      const in48h = new Date(now.getTime() + 48 * 3600000);

      const jobs = await this.prisma.jobPosting.findMany({
        where: { status: 'ACTIVE', isDeleted: false, expiresAt: { gte: in47h, lte: in48h } },
        include: { hostProfile: { select: { userId: true } } },
      });

      for (const job of jobs) {
        await this.notifService.create({
          recipientId: job.hostProfile.userId,
          eventType: 'H_008_POSTING_EXPIRING',
          title: `Reminder: Shift Coverage Needed`,
          body: `Your opportunity "${job.title}" expires in 48 hours with no confirmed locum. Consider extending or reposting.`,
          href: '/host/dashboard',
          referenceId: job.id,
          referenceType: 'JobPosting',
        });
      }
    } catch (err) { this.logger.error('Expiry reminder cron failed', err); }
  }
}
