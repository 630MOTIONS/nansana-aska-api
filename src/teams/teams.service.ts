import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  getLogo(slug: string) {
    return this.prisma.teamLogo.findFirst({
      where: { team: { slug } },
      select: { contentType: true, data: true },
    });
  }
}
