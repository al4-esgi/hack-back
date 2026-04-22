import { user } from 'src/users/users.entity';
import { instagramPost, instagramPostTypeEnum } from 'src/instagram-scraping/instagram-post.entity';

export const schema = { user, instagramPost, instagramPostTypeEnum };
export type Schema = typeof schema;
export type SchemaName = keyof Schema;

export type { SelectUser } from 'src/users/users.entity';
export type { SelectInstagramPost } from 'src/instagram-scraping/instagram-post.entity';
