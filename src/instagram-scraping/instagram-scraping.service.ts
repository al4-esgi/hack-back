import { Injectable, Logger } from '@nestjs/common';
import { InstagramPostMapper } from './_utils/instagram-post.mapper';
import { CACHE_FRESHNESS_HOURS } from './_utils/constants';
import { InstagramPostDto } from './_utils/dto/response/instagram-post.dto';
import { ApifyScraperService } from './apify-scraper.service';
import { InstagramPostRepository } from './instagram-post.repository';

@Injectable()
export class InstagramScrapingService {
  private readonly logger = new Logger(InstagramScrapingService.name);

  constructor(
    private readonly apifyScraperService: ApifyScraperService,
    private readonly instagramPostRepository: InstagramPostRepository,
    private readonly instagramPostMapper: InstagramPostMapper,
  ) {}

  async getPostsByHashtags(hashtags: string[], limit: number): Promise<InstagramPostDto[]> {
    const results = await Promise.all(hashtags.map((hashtag) => this.getPostsForHashtag(hashtag, limit)));
    return results.flat();
  }

  private async getPostsForHashtag(hashtag: string, limit: number): Promise<InstagramPostDto[]> {
    const cached = await this.instagramPostRepository.findFreshBySourceQuery(hashtag, CACHE_FRESHNESS_HOURS);

    if (cached.length > 0) {
      this.logger.log(`Cache hit for #${hashtag} (${cached.length} posts)`);
      return cached.slice(0, limit).map((entity) => this.instagramPostMapper.fromEntity(entity));
    }

    this.logger.log(`Cache miss for #${hashtag}, scraping...`);

    const rawItems = await this.apifyScraperService.scrapeByHashtags([hashtag], limit);
    const dtos = this.instagramPostMapper.toDtoList(rawItems);
    const entities = dtos.map((dto) => this.instagramPostMapper.toEntity(dto, hashtag));

    await this.instagramPostRepository.saveBatch(entities);
    this.logger.log(`Saved ${entities.length} posts to DB for #${hashtag}`);

    return dtos;
  }
}
