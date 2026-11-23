import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types.js";
import type { UploadedImage } from "../common/uploaded-image.js";
import { Prisma } from "../generated/prisma/client.js";
import { MediaService } from "../media/media.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  CreateHighlightDto,
  ListHighlightsDto,
  UpdateHighlightDto,
} from "./dto/highlight.dto.js";
import { parseVideoUrl } from "./video-url.js";
import { fetchYoutubeThumbnail } from "./youtube-thumbnail.js";

const select = {
  id: true,
  title: true,
  description: true,
  category: true,
  videoUrl: true,
  youtubeId: true,
  thumbnailId: true,
  thumbnailAuto: true,
  kicker: true,
  badge: true,
  duration: true,
  date: true,
  spotlight: true,
  featured: true,
  matchSlug: true,
  published: true,
  updatedAt: true,
} satisfies Prisma.HighlightSelect;

type Row = Prisma.HighlightGetPayload<{ select: typeof select }>;

type MatchInfo = {
  slug: string;
  stage: string;
  competition: string;
  homeName: string;
  awayName: string;
  // Only set once the match has a final result.
  homeScore: number | null;
  awayScore: number | null;
};

const BAD_LINK = "Enter the full video link, starting with https://";

// thumbnailUrl is relative to the API, for example /media/<id>.
function toDto(row: Row, match: MatchInfo | null) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    videoUrl: row.videoUrl,
    youtubeId: row.youtubeId,
    kicker: row.kicker,
    badge: row.badge,
    duration: row.duration,
    date: row.date.toISOString(),
    spotlight: row.spotlight,
    featured: row.featured,
    matchSlug: row.matchSlug,
    published: row.published,
    thumbnailUrl: row.thumbnailId ? `/media/${row.thumbnailId}` : null,
    thumbnailAuto: row.thumbnailAuto,
    match,
    updatedAt: row.updatedAt.toISOString(),
  };
}

// "2026-11-22" -> noon in Uganda time, so the day shown never shifts.
function dateFrom(value: string | null | undefined): Date | undefined {
  return value ? new Date(`${value}T12:00:00+03:00`) : undefined;
}

@Injectable()
export class HighlightsService {
  private readonly logger = new Logger(HighlightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  // ---- public: published videos only, newest first ----

  async listPublished(query: ListHighlightsDto) {
    const rows = await this.prisma.highlight.findMany({
      where: { published: true, category: query.category },
      orderBy: { date: "desc" },
      take: query.limit ?? 100,
      select,
    });
    return this.withMatches(rows);
  }

  // ---- admin ----

  async listAll() {
    const rows = await this.prisma.highlight.findMany({
      orderBy: { date: "desc" },
      take: 200,
      select,
    });
    return this.withMatches(rows);
  }

  async get(id: string) {
    const row = await this.prisma.highlight.findUnique({ where: { id }, select });
    if (!row) throw new NotFoundException("Video not found.");
    return (await this.withMatches([row]))[0];
  }

  async create(dto: CreateHighlightDto, actor: AuthUser) {
    const parsed = parseVideoUrl(dto.videoUrl);
    if (!parsed) throw new BadRequestException(BAD_LINK);
    if (dto.matchSlug) await this.assertMatch(dto.matchSlug);

    const published = dto.published ?? true;
    if (!published && (dto.spotlight || dto.featured)) {
      throw new BadRequestException("Publish the video before featuring it.");
    }
    const spotlight = published && (dto.spotlight ?? false);
    const featured = published && (dto.featured ?? false);

    if (spotlight) await this.clearFlag("spotlight");
    if (featured) await this.clearFlag("featured");

    const created = await this.prisma.highlight.create({
      data: {
        title: dto.title,
        description: dto.description ?? "",
        category: dto.category,
        videoUrl: parsed.url,
        youtubeId: parsed.youtubeId,
        kicker: dto.kicker ?? null,
        badge: dto.badge ?? null,
        duration: dto.duration ?? null,
        date: dateFrom(dto.date),
        spotlight,
        featured,
        matchSlug: dto.matchSlug ?? null,
        published,
      },
      select: { id: true },
    });

    if (parsed.youtubeId) await this.autoThumbnail(created.id, parsed.youtubeId);

    this.logger.log(`${actor.email} added video ${created.id}`);
    return this.get(created.id);
  }

  async update(id: string, dto: UpdateHighlightDto, actor: AuthUser) {
    const current = await this.prisma.highlight.findUnique({ where: { id }, select });
    if (!current) throw new NotFoundException("Video not found.");

    const data: Prisma.HighlightUpdateInput = {};
    let youtubeId = current.youtubeId;

    if (dto.videoUrl !== undefined) {
      const parsed = parseVideoUrl(dto.videoUrl);
      if (!parsed) throw new BadRequestException(BAD_LINK);
      data.videoUrl = parsed.url;
      data.youtubeId = parsed.youtubeId;
      youtubeId = parsed.youtubeId;
    }
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.kicker !== undefined) data.kicker = dto.kicker;
    if (dto.badge !== undefined) data.badge = dto.badge;
    if (dto.duration !== undefined) data.duration = dto.duration;
    if (dto.date) data.date = dateFrom(dto.date);
    if (dto.matchSlug !== undefined) {
      if (dto.matchSlug) await this.assertMatch(dto.matchSlug);
      data.matchSlug = dto.matchSlug;
    }

    const published = dto.published ?? current.published;
    if (!published && (dto.spotlight || dto.featured)) {
      throw new BadRequestException("Publish the video before featuring it.");
    }
    // A hidden video cannot stay spotlighted or featured.
    const spotlight = published ? (dto.spotlight ?? current.spotlight) : false;
    const featured = published ? (dto.featured ?? current.featured) : false;
    data.published = published;
    data.spotlight = spotlight;
    data.featured = featured;

    if (spotlight && !current.spotlight) await this.clearFlag("spotlight", id);
    if (featured && !current.featured) await this.clearFlag("featured", id);

    await this.prisma.highlight.update({ where: { id }, data });

    // The video changed: refresh or drop an automatic thumbnail.
    if (youtubeId !== current.youtubeId) {
      if (youtubeId && (current.thumbnailAuto || !current.thumbnailId)) {
        await this.autoThumbnail(id, youtubeId);
      } else if (!youtubeId && current.thumbnailAuto && current.thumbnailId) {
        await this.prisma.highlight.update({
          where: { id },
          data: { thumbnailId: null, thumbnailAuto: false },
        });
        await this.media.removeIfUnused(current.thumbnailId);
      }
    }

    this.logger.log(`${actor.email} updated video ${id}`);
    return this.get(id);
  }

  async setThumbnail(id: string, file: UploadedImage | undefined, actor: AuthUser) {
    const row = await this.prisma.highlight.findUnique({
      where: { id },
      select: { thumbnailId: true },
    });
    if (!row) throw new NotFoundException("Video not found.");

    const image = await this.media.create(file);
    await this.prisma.highlight.update({
      where: { id },
      data: { thumbnailId: image.id, thumbnailAuto: false },
    });
    if (row.thumbnailId) await this.media.removeIfUnused(row.thumbnailId);

    this.logger.log(`${actor.email} set the thumbnail of video ${id}`);
    return this.get(id);
  }

  async removeThumbnail(id: string, actor: AuthUser) {
    const row = await this.prisma.highlight.findUnique({
      where: { id },
      select: { thumbnailId: true },
    });
    if (!row) throw new NotFoundException("Video not found.");

    await this.prisma.highlight.update({
      where: { id },
      data: { thumbnailId: null, thumbnailAuto: false },
    });
    if (row.thumbnailId) await this.media.removeIfUnused(row.thumbnailId);
    this.logger.log(`${actor.email} removed the thumbnail of video ${id}`);
  }

  // Fetches the thumbnail from YouTube again.
  async refreshThumbnail(id: string, actor: AuthUser) {
    const row = await this.prisma.highlight.findUnique({
      where: { id },
      select: { youtubeId: true },
    });
    if (!row) throw new NotFoundException("Video not found.");
    if (!row.youtubeId) {
      throw new BadRequestException("Only YouTube videos have an automatic thumbnail.");
    }

    const done = await this.autoThumbnail(id, row.youtubeId);
    if (!done) {
      throw new BadRequestException(
        "Could not get the thumbnail from YouTube. Upload one instead.",
      );
    }
    this.logger.log(`${actor.email} refreshed the thumbnail of video ${id}`);
    return this.get(id);
  }

  async remove(id: string, actor: AuthUser) {
    const row = await this.prisma.highlight.findUnique({
      where: { id },
      select: { thumbnailId: true },
    });
    if (!row) throw new NotFoundException("Video not found.");

    await this.prisma.highlight.delete({ where: { id } });
    if (row.thumbnailId) await this.media.removeIfUnused(row.thumbnailId);
    this.logger.log(`${actor.email} deleted video ${id}`);
  }

  // ---- helpers ----

  private async clearFlag(flag: "spotlight" | "featured", exceptId?: string) {
    await this.prisma.highlight.updateMany({
      where: { [flag]: true, ...(exceptId ? { id: { not: exceptId } } : {}) },
      data: { [flag]: false },
    });
  }

  private async assertMatch(slug: string) {
    const match = await this.prisma.match.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!match) throw new BadRequestException("That match does not exist.");
  }

  // Returns false (and changes nothing) when no thumbnail could be fetched.
  private async autoThumbnail(id: string, youtubeId: string): Promise<boolean> {
    const bytes = await fetchYoutubeThumbnail(youtubeId);
    if (!bytes) return false;

    try {
      const previous = await this.prisma.highlight.findUnique({
        where: { id },
        select: { thumbnailId: true },
      });
      const image = await this.media.create({ buffer: bytes, size: bytes.length });
      await this.prisma.highlight.update({
        where: { id },
        data: { thumbnailId: image.id, thumbnailAuto: true },
      });
      if (previous?.thumbnailId) await this.media.removeIfUnused(previous.thumbnailId);
      return true;
    } catch {
      return false;
    }
  }

  private async withMatches(rows: Row[]) {
    const slugs = Array.from(
      new Set(rows.flatMap((row) => (row.matchSlug ? [row.matchSlug] : []))),
    );

    const infos = new Map<string, MatchInfo>();
    if (slugs.length > 0) {
      const matches = await this.prisma.match.findMany({
        where: { slug: { in: slugs } },
        select: {
          slug: true,
          stage: true,
          status: true,
          homeScore: true,
          awayScore: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
          competition: { select: { name: true } },
        },
      });
      for (const match of matches) {
        const final = match.status === "final";
        infos.set(match.slug, {
          slug: match.slug,
          stage: match.stage,
          competition: match.competition.name,
          homeName: match.homeTeam.name,
          awayName: match.awayTeam.name,
          homeScore: final ? match.homeScore : null,
          awayScore: final ? match.awayScore : null,
        });
      }
    }

    return rows.map((row) =>
      toDto(row, row.matchSlug ? (infos.get(row.matchSlug) ?? null) : null),
    );
  }
}
