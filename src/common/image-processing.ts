import {
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { detectImageType } from "./image.js";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_WIDTH = 1600;
const MAX_PIXELS = 40_000_000; // refuses decompression bombs

export type ProcessedImage = {
  data: Buffer;
  contentType: "image/webp";
  size: number;
  width: number;
  height: number;
};

// Resizes a photo and converts it to WebP. Reading it and writing a new file
// also removes EXIF data (GPS location, camera, time) from the result.
export async function processPhoto(input: Buffer): Promise<ProcessedImage> {
  if (!detectImageType(input)) {
    throw new BadRequestException("The image must be a PNG, JPEG or WebP file.");
  }

    let sharp: (typeof import('sharp'))['default'];
    try {
      sharp = (await import('sharp')).default;
    } catch {
      throw new ServiceUnavailableException(
        'Image processing is not available on the server.',
      );
    }

  try {
    const { data, info } = await sharp(input, { limitInputPixels: MAX_PIXELS })
      .rotate() // applies the camera's orientation, then drops the tag
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    return {
      data,
      contentType: "image/webp",
      size: data.length,
      width: info.width,
      height: info.height,
    };
  } catch {
    throw new BadRequestException(
      "That image could not be read. Try saving it again as a JPEG or PNG.",
    );
  }
}
