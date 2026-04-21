import { Global, Module } from '@nestjs/common';
import { DrizzleProvider } from './database.providers';
import { DrizzleService } from './database.service';

@Global()
@Module({
  providers: [DrizzleService, DrizzleProvider],
  exports: [DrizzleService],
})
export class DatabaseModule {}
