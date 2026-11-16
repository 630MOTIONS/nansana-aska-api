// Imports logo files into the database. Each file must be named after the
// team's slug, for example park-fc.jpg or mengo-city.png. Files whose team does
// not exist yet are skipped, so you can run this again after creating teams.
//
// Usage:
//   pnpm exec tsx --env-file=.env src/scripts/import-logos.ts <folder>
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { detectImageType, MAX_LOGO_BYTES } from "../common/image.js";

const folder = process.argv[2];
if (!folder) {
  console.error(
    "Usage: pnpm exec tsx --env-file=.env src/scripts/import-logos.ts <folder>",
  );
  process.exit(1);
}

const EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

async function main() {
  for (const file of (await readdir(folder)).sort()) {
    const extension = path.extname(file).toLowerCase();
    if (!EXTENSIONS.has(extension)) continue;

    const slug = path.basename(file, extension).toLowerCase();
    const team = await prisma.team.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!team) {
      console.log(`skip  ${file}: no team with the slug "${slug}"`);
      continue;
    }

    const bytes = await readFile(path.join(folder, file));
    if (bytes.length > MAX_LOGO_BYTES) {
      console.log(
        `skip  ${file}: ${Math.round(bytes.length / 1024)} KB is over the 500 KB limit`,
      );
      continue;
    }

    const contentType = detectImageType(bytes);
    if (!contentType) {
      console.log(`skip  ${file}: not a PNG, JPEG or WebP image`);
      continue;
    }

    const data = new Uint8Array(bytes);
    await prisma.teamLogo.upsert({
      where: { teamId: team.id },
      update: { contentType, data, size: bytes.length },
      create: { teamId: team.id, contentType, data, size: bytes.length },
    });
    console.log(`ok    ${file} -> ${slug}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
