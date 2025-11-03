import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv'

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ["http://localhost:5173", "http://localhost:3000", "https://kumbukkal-pepper-admin-fe.vercel.app", "https://kumbukkal-pepper-fe.vercel.app"]
  })

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true, // ✅ converts string -> number automatically
    },
    exceptionFactory: (errors) => {
      const firstError = errors[0]
      const constraints = firstError?.constraints
      const firstMessage = constraints ? Object.values(constraints)?.[0] : 'Validation Failed'
      throw new BadRequestException(firstMessage)
    }
  }))
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
