import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types.js";
import { slugify } from "../common/slug.js";
import type { UploadedImage } from "../common/uploaded-image.js";
import { Prisma } from "../generated/prisma/client.js";
import { MediaService } from "../media/media.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  extractMediaIds,
  missingForPublish,
  normalizeBody,
  readMinutes,
} from "./article-utils.js";
import { CreateArticleDto } from "./dto/create-article.dto.js";
import {
  ListAdminArticlesDto,
  ListPublishedArticlesDto,
} from "./dto/list-articles.dto.js";
import { UpdateArticleDto } from "./dto/update-article.dto.js";

const listSelect = {
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  status: true,
  featured: true,
  authorName: true,
  coverImageId: true,
  readMinutes: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ArticleSelect;

const fullSelect = { ...listSelect, body: true } satisfies Prisma.ArticleSelect;

type ListRow = Prisma.ArticleGetPayload<{ select: typeof listSelect }>;
type FullRow = Prisma.ArticleGetPayload<{ select: typeof fullSelect }>;

// coverUrl is relative to the API, for example /media/<id>.
function toSummary(row: ListRow) {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    status: row.status,
    featured: row.featured,
    authorName: row.authorName,
    coverUrl: row.coverImageId ? `/media/${row.coverImageId}` : null,
    readMinutes: row.readMinutes,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFull(row: FullRow) {
  return { ...toSummary(row), body: row.body };
}

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  // ---- public: published articles only ----

  async listPublished(query: ListPublishedArticlesDto) {
    const rows = await this.prisma.article.findMany({
      where: { status: "published", category: query.category },
      orderBy: { publishedAt: "desc" },
      take: query.limit ?? 20,
      select: listSelect,
    });
    return rows.map(toSummary);
  }

  async getPublished(slug: string) {
    const row = await this.prisma.article.findFirst({
      where: { slug, status: "published" },
      select: fullSelect,
    });
    if (!row) throw new NotFoundException("Article not found.");
    return toFull(row);
  }

  // ---- admin ----

  async listAll(query: ListAdminArticlesDto) {
    const rows = await this.prisma.article.findMany({
      where: { status: query.status, category: query.category },
      orderBy: { updatedAt: "desc" },
      take: query.limit ?? 100,
      select: listSelect,
    });
    return rows.map(toSummary);
  }

  async getAny(slug: string) {
    const row = await this.prisma.article.findUnique({
      where: { slug },
      select: fullSelect,
    });
    if (!row) throw new NotFoundException("Article not found.");
    return toFull(row);
  }

  async create(dto: CreateArticleDto, actor: AuthUser) {
    const base = slugify(dto.title, 80);
    if (!base) {
      throw new BadRequestException(
        "Could not make a web address from that title.",
      );
    }
    const slug = await this.uniqueSlug(base);

    const excerpt = dto.excerpt ?? "";
    const body = normalizeBody(dto.body ?? "");
    const status = dto.status ?? "draft";
    if (status === "published") this.requirePublishable(dto.title, excerpt, body);

    const create = this.prisma.article.create({
      data: {
        slug,
        title: dto.title,
        excerpt,
        body,
        category: dto.category,
        status,
        featured: dto.featured ?? false,
        authorName: dto.authorName || actor.name,
        readMinutes: readMinutes(body),
        publishedAt: status === "published" ? new Date() : null,
      },
      select: { id: true },
    });

    if (dto.featured) {
      await this.prisma.$transaction([
        this.prisma.article.updateMany({
          where: { featured: true },
          data: { featured: false },
        }),
        create,
      ]);
    } else {
      await create;
    }

    this.logger.log(`${actor.email} created article ${slug} (${status})`);
    return this.getAny(slug);
  }

  async update(slug: string, dto: UpdateArticleDto, actor: AuthUser) {
    const current = await this.prisma.article.findUnique({
      where: { slug },
      select: fullSelect,
    });
    if (!current) throw new NotFoundException("Article not found.");

    const title = dto.title ?? current.title;
    const excerpt = dto.excerpt ?? current.excerpt;
    const body =
      dto.body !== undefined ? normalizeBody(dto.body) : current.body;
    const status = dto.status ?? current.status;
    const featured = dto.featured ?? current.featured;

    if (status === "published") this.requirePublishable(title, excerpt, body);

    const data: Prisma.ArticleUpdateInput = {
      title,
      excerpt,
      body,
      status,
      featured,
      readMinutes: readMinutes(body),
    };
    if (dto.category) data.category = dto.category;
    if (dto.authorName) data.authorName = dto.authorName;
    // The first publish date is kept, even after unpublishing and republishing.
    if (status === "published" && current.publishedAt === null) {
      data.publishedAt = new Date();
    }

    const update = this.prisma.article.update({ where: { slug }, data });
    if (featured) {
      await this.prisma.$transaction([
        this.prisma.article.updateMany({
          where: { featured: true, slug: { not: slug } },
          data: { featured: false },
        }),
        update,
      ]);
    } else {
      await update;
    }

    // Photos that were in the old text and are gone from the new text.
    const kept = new Set(extractMediaIds(body));
    for (const id of extractMediaIds(current.body)) {
      if (!kept.has(id)) await this.media.removeIfUnused(id);
    }

    this.logger.log(`${actor.email} updated article ${slug} (${status})`);
    return this.getAny(slug);
  }

  async setCover(
    slug: string,
    file: UploadedImage | undefined,
    actor: AuthUser,
  ) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { coverImageId: true },
    });
    if (!article) throw new NotFoundException("Article not found.");

    const image = await this.media.create(file);
    await this.prisma.article.update({
      where: { slug },
      data: { coverImageId: image.id },
    });
    if (article.coverImageId) {
      await this.media.removeIfUnused(article.coverImageId);
    }

    this.logger.log(`${actor.email} set the cover of article ${slug}`);
    return this.getAny(slug);
  }

  async removeCover(slug: string, actor: AuthUser) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { coverImageId: true },
    });
    if (!article) throw new NotFoundException("Article not found.");

    await this.prisma.article.update({
      where: { slug },
      data: { coverImageId: null },
    });
    if (article.coverImageId) {
      await this.media.removeIfUnused(article.coverImageId);
    }

    this.logger.log(`${actor.email} removed the cover of article ${slug}`);
  }

  async remove(slug: string, actor: AuthUser) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { body: true, coverImageId: true },
    });
    if (!article) throw new NotFoundException("Article not found.");

    await this.prisma.article.delete({ where: { slug } });

    const ids = new Set(extractMediaIds(article.body));
    if (article.coverImageId) ids.add(article.coverImageId);
    for (const id of ids) await this.media.removeIfUnused(id);

    this.logger.log(`${actor.email} deleted article ${slug}`);
  }

  private requirePublishable(title: string, excerpt: string, body: string) {
    const problem = missingForPublish({ title, excerpt, body });
    if (problem) throw new BadRequestException(problem);
  }

  private async uniqueSlug(base: string) {
    for (let attempt = 1; attempt <= 20; attempt++) {
      const candidate = attempt === 1 ? base : `${base}-${attempt}`;
      const taken = await this.prisma.article.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!taken) return candidate;
    }
    throw new ConflictException("Could not make a unique address for this article.");
  }
}
