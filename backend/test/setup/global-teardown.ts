import { disconnectTestDb } from '../helpers/db';

export default async function globalTeardown(): Promise<void> {
  await disconnectTestDb();
}
