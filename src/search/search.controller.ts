import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AutocompleteQueryDto, CityAutocompleteQueryDto } from 'src/_utils/dto/requests/autocomplete-query.dto';
import { AutocompleteOptionDto } from 'src/_utils/dto/responses/autocomplete-option.dto';
import { UnifiedSearchQueryDto } from './_utils/dto/request/unified-search.query.dto';
import { UnifiedSearchResultDto } from './_utils/dto/response/unified-search-result.dto';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('filters/countries')
  @ApiOperation({ summary: 'Countries for autocomplete (optional `q` substring filter).' })
  @ApiOkResponse({ type: [AutocompleteOptionDto] })
  autocompleteCountries(@Query() query: AutocompleteQueryDto): Promise<AutocompleteOptionDto[]> {
    return this.searchService.autocompleteCountries(query.q, query.limit);
  }

  @Get('filters/cities')
  @ApiOperation({ summary: 'Cities for autocomplete (optional `q`, optional `countryId`).' })
  @ApiOkResponse({ type: [AutocompleteOptionDto] })
  autocompleteCities(@Query() query: CityAutocompleteQueryDto): Promise<AutocompleteOptionDto[]> {
    return this.searchService.autocompleteCities(query.q, query.limit, query.countryId);
  }

  @Get()
  @ApiOperation({
    summary: 'Unified search across hotels and restaurants (replaces former GET /hotels and GET /restaurants list).',
    description:
      'Returns hotels and/or restaurants matching the given filters with a single shared pagination. ' +
      'Use `types=hotel`, `types=restaurant`, or both (default). Hotel-only and restaurant-only filters apply only to their type. ' +
      'Sorting includes `name`, `createdAt`, `stars` (restaurants; hotels sort as no stars), and `distance` when `lat`+`lng` are set. ' +
      'Provide `lat`, `lng`, and optionally `radiusKm` for geospatial radius search.',
  })
  @ApiOkResponse({ type: UnifiedSearchResultDto })
  search(@Query() query: UnifiedSearchQueryDto): Promise<UnifiedSearchResultDto> {
    return this.searchService.search(query);
  }
}
