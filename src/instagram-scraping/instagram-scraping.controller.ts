import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HashtagsQueryDto } from './_utils/dto/request/hashtags-query.dto';
import { InstagramPostDto } from './_utils/dto/response/instagram-post.dto';
import { InstagramScrapingService } from './instagram-scraping.service';

@ApiTags('Instagram Scraping')
@Controller('instagram-scraping')
export class InstagramScrapingController {
  constructor(private readonly instagramScrapingService: InstagramScrapingService) {}

  @Get('hashtags')
  @ApiOperation({ summary: 'Scrape Instagram posts by hashtags (cached 24h)' })
  getByHashtags(@Query() query: HashtagsQueryDto): Promise<InstagramPostDto[]> {
    return this.instagramScrapingService.getPostsByHashtags(query.tags, query.limit);
  }
}
