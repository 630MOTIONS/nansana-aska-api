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
  app.enableCors({
    origin: (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim()),
    methods: ["GET", "POST"],
  });

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
