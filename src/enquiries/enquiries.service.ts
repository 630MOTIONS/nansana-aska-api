import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateEnquiryDto } from "./dto/create-enquiry.dto.js";

@Injectable()
export class EnquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateEnquiryDto) {
    return this.prisma.enquiry.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        organisation: dto.organisation,
        type: dto.type,
        subject: dto.subject,
        message: dto.message,
        consent: dto.consent,
      },
      // Only the id comes back, never the visitor's personal details.
      select: { id: true },
    });
  }
}
