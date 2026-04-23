import { Module } from '@nestjs/common';
import { AutocompleteHelper } from 'src/_shared/autocomplete/autocomplete.helper';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  controllers: [SearchController],
  providers: [SearchService, AutocompleteHelper],
})
export class SearchModule {}
