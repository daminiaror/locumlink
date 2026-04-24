import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
        const adapter = new PrismaPg(pool);
        super({ adapter });
    }
    async onModuleInit(): Promise<void> {
        try {
            await this.$connect();
        }
        catch (err) {
            console.error('[PrismaService] Database connection failed on startup', err);
        }
    }
    async onModuleDestroy(): Promise<void> {
        await this.$disconnect();
    }
}
