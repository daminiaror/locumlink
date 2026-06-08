import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaClientKnownExceptionFilter } from '../../src/prisma/prisma-client-exception.filter';

const envTestPath = resolve(__dirname, '../../.env.test');
if (existsSync(envTestPath)) {
  loadEnv({ path: envTestPath, override: true });
}
process.env.NODE_ENV = 'test';
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

export type TestAppContext = {
  app: INestApplication<App>;
  agent: ReturnType<typeof request>;
};

export async function createTestApp(): Promise<TestAppContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalFilters(new PrismaClientKnownExceptionFilter());
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  await app.init();

  const agent = request(app.getHttpServer());
  return { app, agent };
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
}
