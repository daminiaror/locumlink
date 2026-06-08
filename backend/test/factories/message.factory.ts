import { type Message } from '@prisma/client';
import { getTestDb } from '../helpers/db';

export async function createMessage(params: {
  senderId: string;
  recipientId: string;
  body: string;
  sentAt?: Date;
  jobPostingId?: string;
}): Promise<Message> {
  const db = getTestDb();
  return db.message.create({
    data: {
      senderId: params.senderId,
      recipientId: params.recipientId,
      body: params.body,
      sentAt: params.sentAt ?? new Date(),
      jobPostingId: params.jobPostingId ?? null,
    },
  });
}

/** Seed many messages with monotonic sentAt for pagination tests. */
export async function createMessageThread(
  senderId: string,
  recipientId: string,
  count: number,
  prefix = 'msg',
): Promise<Message[]> {
  const base = Date.now() - count * 60_000;
  const messages: Message[] = [];
  for (let i = 0; i < count; i += 1) {
    messages.push(
      await createMessage({
        senderId: i % 2 === 0 ? senderId : recipientId,
        recipientId: i % 2 === 0 ? recipientId : senderId,
        body: `${prefix}-${i + 1}`,
        sentAt: new Date(base + i * 60_000),
      }),
    );
  }
  return messages;
}
