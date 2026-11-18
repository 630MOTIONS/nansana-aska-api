import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Reject unknown fields and invalid values before they reach the database.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Only the website may call this API from a browser.
  // FRONTEND_ORIGIN can hold several origins separated by commas.
  const origins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST'],
  });

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();