import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { CreateEnquiryDto } from "./dto/create-enquiry.dto.js";
import { EnquiriesService } from "./enquiries.service.js";

@Controller("enquiries")
export class EnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateEnquiryDto) {
    const saved = await this.enquiries.create(dto);
    return { received: true, id: saved.id };
  }
}
