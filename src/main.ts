import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://www.kpi-creatives.com',
      'https://www.indiev.org',
      'https://www.start-podcast.com',
      'https://app.attio.com',
      'https://www.salesforge.ai/',
      'https://app.salesforge.ai/',
      'https://feedback.valuemaxrentals.com',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
