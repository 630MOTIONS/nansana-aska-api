import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { CompetitionsModule } from './competitions/competitions.module.js';
import { EnquiriesModule } from './enquiries/enquiries.module.js';
import { HealthModule } from './health/health.module.js';
import { MatchesModule } from './matches/matches.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EnquiriesModule,
    HealthModule,
    CompetitionsModule,
    MatchesModule,
  ],
})
export class AppModule {}
