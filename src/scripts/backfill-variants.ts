// Makes the smaller copies for photos uploaded before they existed. Safe to run
// more than once: photos that already have their copies are skipped.
//
// Usage:
//   pnpm exec tsx --env-file=.env src/scripts/backfill-variants.ts
import { PrismaPg } from "@prisma/adapter-pg";
import sharp from "sharp";
import { PrismaClient } from "../generated/prisma/client.js";
import { VARIANT_WIDTHS } from "../common/image-processing.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

async function main() {
  const images = await prisma.mediaImage.findMany({
    select: { id: true, width: true },
    orderBy: { createdAt: "asc" },
  });

  let photos = 0;
  let copies = 0;

  for (const image of images) {
    const needed = VARIANT_WIDTHS.filter((width) => width < image.width);
    if (needed.length === 0) continue;

    const have = await prisma.mediaVariant.count({
      where: { imageId: image.id },
    });
    if (have >= needed.length) continue;

    const full = await prisma.mediaImage.findUnique({
      where: { id: image.id },
      select: { data: true },
    });
    if (!full) continue;

    const base = sharp(Buffer.from(full.data));
    for (const width of needed) {
      const data = await base
        .clone()
        .resize({ width })
        .webp({ quality: 80 })
        .toBuffer();
      await prisma.mediaVariant.upsert({
        where: { imageId_width: { imageId: image.id, width } },
        update: {},
        create: {
          imageId: image.id,
          width,
          contentType: "image/webp",
          data: new Uint8Array(data),
          size: data.length,
        },
      });
      copies += 1;
    }
    photos += 1;
    console.log(`ok  ${image.id}`);
  }

  console.log(`Created ${copies} copies for ${photos} photos.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
