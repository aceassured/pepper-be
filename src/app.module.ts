import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [PrismaModule,UserModule, OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
