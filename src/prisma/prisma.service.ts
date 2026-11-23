import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
      // A few connections are plenty for this site.
      max: 5,
      // Neon closes idle connections and puts an idle database to sleep.
      // Dropping our own idle connections early means a connection the server
      // already closed is never reused ("Server has closed the connection").
      idleTimeoutMillis: 10_000,
      // The first connection after the database wakes up can take a few seconds.
      connectionTimeoutMillis: 20_000,
      keepAlive: true,
    });
    super({ adapter });
  }
}
