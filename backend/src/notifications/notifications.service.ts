import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PushService } from './push.service.js';

export type NotifEventType =
  // Host
  | 'H_001_LOCUM_APPLIED'
  | 'H_002_LOCUM_ACCEPTED'
  | 'H_003_LOCUM_DECLINED'
  | 'H_004_NEW_MESSAGE'
  | 'H_005_ACCOUNT_VERIFIED'
  | 'H_006_ACCOUNT_REJECTED'
  | 'H_007_ACCOUNT_SUSPENDED'
  | 'H_008_POSTING_EXPIRING'
  | 'H_009_SHIFT_CANCELLED'
  // Locum
  | 'L_001_NEW_OPPORTUNITY'
  | 'L_002_HOST_CONFIRMED'
  | 'L_003_APPLICATION_ACCEPTED'
  | 'L_004_APPLICATION_DECLINED'
  | 'L_005_SHIFT_REMINDER_48H'
  | 'L_006_SHIFT_REMINDER_EVENING'
  | 'L_007_SHIFT_REMINDER_2H'
  | 'L_008_NEW_MESSAGE'
  | 'L_009_ACCOUNT_VERIFIED'
  | 'L_010_ACCOUNT_REJECTED'
  | 'L_011_ACCOUNT_SUSPENDED'
  // Admin
  | 'A_001_NEW_HOST_REGISTRATION'
  | 'A_002_NEW_LOCUM_REGISTRATION'
  | 'A_003_CREDENTIAL_UPLOADED'
  | 'A_004_ACCOUNT_FLAGGED';

export type NotificationItem = {
  id: string;
  type: 'message' | 'application' | 'shortlisted' | 'reminder' | 'account' | 'cancellation' | 'registration' | 'credential' | 'flagged';
  category?: 'messages' | 'applications' | 'reminders' | 'account' | 'cancellations';
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
};

function eventTypeToCategory(eventType: string): NotificationItem['type'] {
  if (eventType.includes('MESSAGE')) return 'message';
  if (eventType.includes('APPLIED') || eventType.includes('ACCEPTED') || eventType.includes('DECLINED') || eventType.includes('CONFIRMED')) return 'application';
  if (eventType.includes('REMINDER') || eventType.includes('EXPIRING')) return 'reminder';
  if (eventType.includes('CANCELLED')) return 'cancellation';
  if (eventType.includes('REGISTRATION')) return 'registration';
  if (eventType.includes('CREDENTIAL')) return 'credential';
  if (eventType.includes('FLAGGED')) return 'flagged';
  if (eventType.includes('VERIFIED') || eventType.includes('REJECTED') || eventType.includes('SUSPENDED')) return 'account';
  return 'application';
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async create(params: {
    recipientId: string;
    eventType: NotifEventType;
    title: string;
    body: string;
    href: string;
    referenceId?: string;
    referenceType?: string;
    pushTitle?: string;
    pushBody?: string;
  }): Promise<void> {
    await this.prisma.notificationEvent.create({
      data: {
        recipientId: params.recipientId,
        eventType: params.eventType,
        referenceId: params.referenceId,
        referenceType: params.referenceType,
        payload: { title: params.title, body: params.body, href: params.href },
        deliveryStatus: 'DELIVERED',
        deliveredAt: new Date(),
      },
    });

    // Send push notification
    await this.push.sendToUser(params.recipientId, {
      title: params.pushTitle ?? params.title,
      body: params.pushBody ?? params.body,
      url: params.href,
    });
  }

  async getNotifications(userId: string, _role: string): Promise<{
    total: number;
    notifications: NotificationItem[];
  }> {
    const events = await this.prisma.notificationEvent.findMany({
      where: { recipientId: userId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });

    const notifications: NotificationItem[] = events.map((e) => {
      const payload = (e.payload ?? {}) as { title?: string; body?: string; href?: string };
      return {
        id: e.id,
        type: eventTypeToCategory(e.eventType),
        title: payload.title ?? e.eventType,
        body: payload.body ?? '',
        href: payload.href ?? '/',
        read: e.deliveryStatus === 'READ',
        createdAt: e.sentAt.toISOString(),
      };
    });

    const unread = notifications.filter((n) => !n.read).length;
    return { total: unread, notifications };
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notificationEvent.updateMany({
      where: { recipientId: userId, deliveryStatus: { not: 'READ' } },
      data: { deliveryStatus: 'READ' },
    });
  }

  async markRead(userId: string, notifId: string): Promise<void> {
    await this.prisma.notificationEvent.updateMany({
      where: { id: notifId, recipientId: userId },
      data: { deliveryStatus: 'READ' },
    });
  }
}
