import {
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { detectImageType } from "./image.js";

// Phone and camera photos are often 5 to 20 MB. The admin shrinks them in the
// browser first, so this limit mostly applies to files it cannot shrink.
export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;

const MAX_WIDTH = 1600;
// Smaller copies for cards. A card asks for a width and gets the closest copy
// that is at least that wide.
export const VARIANT_WIDTHS = [480, 960];
const MAX_PIXELS = 80_000_000; // refuses decompression bombs

export type ProcessedVariant = { data: Buffer; width: number; size: number };

export type ProcessedImage = {
  data: Buffer;
  contentType: "image/webp";
  size: number;
  width: number;
  height: number;
  variants: ProcessedVariant[];
};

// Resizes a photo, converts it to WebP and makes the smaller copies. Reading it
// and writing new files also removes EXIF data (GPS location, camera, time).
export async function processPhoto(input: Buffer): Promise<ProcessedImage> {
  if (!detectImageType(input)) {
    throw new BadRequestException("The image must be a PNG, JPEG or WebP file.");
  }

  let sharp: (typeof import('sharp'))['default'];
  try {
    sharp = (await import("sharp")).default;
  } catch {
    throw new ServiceUnavailableException(
      "Image processing is not available on the server.",
    );
  }

  try {
    // .rotate() applies the camera's orientation, then drops the tag.
    const base = sharp(input, { limitInputPixels: MAX_PIXELS }).rotate();

    const main = await base
      .clone()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    const variants: ProcessedVariant[] = [];
    for (const width of VARIANT_WIDTHS) {
      if (width >= main.info.width) continue; // the photo is already that small
      const copy = await base
        .clone()
        .resize({ width })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });
      variants.push({
        data: copy.data,
        width: copy.info.width,
        size: copy.data.length,
      });
    }

    return {
      data: main.data,
      contentType: "image/webp",
      size: main.data.length,
      width: main.info.width,
      height: main.info.height,
      variants,
    };
  } catch {
    throw new BadRequestException(
      "That image could not be read. Try saving it again as a JPEG or PNG.",
    );
  }
}
