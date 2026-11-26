import { Controller, Get } from "@nestjs/common";
import { SiteImagesService } from "./site-images.service.js";

// Public: which photo is set for each place on the website.
@Controller("site-images")
export class SiteImagesController {
  constructor(private readonly siteImages: SiteImagesService) {}

  @Get()
  list() {
    return this.siteImages.list();
  }
}
