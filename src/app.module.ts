import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EnquiriesModule } from "./enquiries/enquiries.module.js";
import { HealthModule } from "./health/health.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EnquiriesModule,
    HealthModule,
  ],
})
export class AppModule {}
