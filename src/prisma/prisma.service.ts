import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import PrismaPkg from '@prisma/client'; // ✅ default import for Prisma 6
const { PrismaClient } = PrismaPkg as any    // destructure constructor

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
