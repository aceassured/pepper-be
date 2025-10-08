import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv'

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
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
