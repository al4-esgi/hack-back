import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { DatabaseService } from 'src/database/database.service';
import { instagramPost, NewInstagramPost, SelectInstagramPost } from './instagram-post.entity';

@Injectable()
export class InstagramPostRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findFreshBySourceQuery(sourceQuery: string, freshnessHours: number): Promise<SelectInstagramPost[]> {
    const freshnessCutoff = new Date(Date.now() - freshnessHours * 60 * 60 * 1000);

    return this.databaseService.db
      .select()
      .from(instagramPost)
      .where(
        and(
          eq(instagramPost.sourceQuery, sourceQuery),
          gte(instagramPost.scrapedAt, freshnessCutoff),
        ),
      )
      .orderBy(desc(instagramPost.postTimestamp));
  }

  async saveBatch(posts: NewInstagramPost[]): Promise<void> {
    if (posts.length === 0) return;

    await this.databaseService.db
      .insert(instagramPost)
      .values(posts)
      .onConflictDoUpdate({
        target: instagramPost.id,
        set: {
          likesCount: sql`excluded.likes_count`,
          commentsCount: sql`excluded.comments_count`,
          displayUrl: sql`excluded.display_url`,
          images: sql`excluded.images`,
          scrapedAt: sql`excluded.scraped_at`,
        },
      });
  }
}
