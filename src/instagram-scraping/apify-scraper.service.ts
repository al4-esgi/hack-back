import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApifyClient } from 'apify-client';
import { APIFY_ACTOR_ID, INSTAGRAM_HASHTAG_URL_PREFIX } from './_utils/constants';

@Injectable()
export class ApifyScraperService {
  private readonly logger = new Logger(ApifyScraperService.name);
  private readonly apifyClient: ApifyClient;

  constructor(private readonly configService: ConfigService) {
    this.apifyClient = new ApifyClient({
      token: this.configService.get<string>('APIFY_TOKEN'),
    });
  }

  async scrapeByHashtags(hashtags: string[], limit: number): Promise<unknown[]> {
    this.logger.log(`Starting Apify scrape — hashtags: [${hashtags.join(', ')}], limit: ${limit}`);

    const input = {
      directUrls: hashtags.map((tag) => `${INSTAGRAM_HASHTAG_URL_PREFIX}${tag}/`),
      resultsType: 'posts',
      resultsLimit: limit,
    };

    try {
      const run = await this.apifyClient.actor(APIFY_ACTOR_ID).call(input);
      const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();

      this.logger.log(`Apify scrape completed — retrieved ${items.length} items`);

      return items;
    } catch (error) {
      this.logger.error(`Apify scrape failed: ${(error as Error).message}`, (error as Error).stack);
      throw new ServiceUnavailableException('Failed to scrape Instagram via Apify');
    }
  }
}
