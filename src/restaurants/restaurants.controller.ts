import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AutocompleteQueryDto, CityAutocompleteQueryDto } from './_utils/dto/request/autocomplete.query.dto';
import { AutocompleteOptionDto } from './_utils/dto/response/autocomplete-option.dto';
import { SearchRestaurantsQueryDto } from './_utils/dto/request/search-restaurants.query.dto';
import { RestaurantsService } from './restaurants.service';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @ApiOperation({ summary: 'Search restaurants with advanced filters.' })
  searchRestaurants(@Query() query: SearchRestaurantsQueryDto) {
    return this.restaurantsService.searchRestaurants(query);
  }

  @Get('filters/countries')
  @ApiOperation({ summary: 'Countries for autocomplete (optional `q` substring filter).' })
  @ApiOkResponse({ type: [AutocompleteOptionDto] })
  autocompleteCountries(@Query() query: AutocompleteQueryDto) {
    return this.restaurantsService.autocompleteCountries(query.q, query.limit);
  }

  @Get('filters/cities')
  @ApiOperation({ summary: 'Cities for autocomplete (optional `q`, optional `countryId`).' })
  @ApiOkResponse({ type: [AutocompleteOptionDto] })
  autocompleteCities(@Query() query: CityAutocompleteQueryDto) {
    return this.restaurantsService.autocompleteCities(query.q, query.limit, query.countryId);
  }

  @Get('filters/cuisines')
  @ApiOperation({ summary: 'Cuisines for autocomplete (optional `q` substring filter).' })
  @ApiOkResponse({ type: [AutocompleteOptionDto] })
  autocompleteCuisines(@Query() query: AutocompleteQueryDto) {
    return this.restaurantsService.autocompleteCuisines(query.q, query.limit);
  }

  @Get('filters/facilities')
  @ApiOperation({ summary: 'Facilities for autocomplete (optional `q` substring filter).' })
  @ApiOkResponse({ type: [AutocompleteOptionDto] })
  autocompleteFacilities(@Query() query: AutocompleteQueryDto) {
    return this.restaurantsService.autocompleteFacilities(query.q, query.limit);
  }

  @Get(':restaurantId')
  @ApiParam({ type: 'number', name: 'restaurantId' })
  @ApiOperation({ summary: 'Get restaurant details by ID.' })
  getRestaurantById(@Param('restaurantId', ParseIntPipe) restaurantId: number) {
    return this.restaurantsService.getRestaurantById(restaurantId);
  }
}
