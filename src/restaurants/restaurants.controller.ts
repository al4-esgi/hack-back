import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AutocompleteQueryDto } from 'src/_utils/dto/requests/autocomplete-query.dto';
import { AutocompleteOptionDto } from 'src/_utils/dto/responses/autocomplete-option.dto';
import { RestaurantDetailsDto } from './_utils/dto/response/restaurant-details.dto';
import { RestaurantsService } from './restaurants.service';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get('filters/cuisines')
  @ApiOperation({ summary: 'Cuisines for autocomplete (optional `q` substring filter).' })
  @ApiOkResponse({ type: [AutocompleteOptionDto] })
  autocompleteCuisines(@Query() query: AutocompleteQueryDto): Promise<AutocompleteOptionDto[]> {
    return this.restaurantsService.autocompleteCuisines(query.q, query.limit);
  }

  @Get('filters/facilities')
  @ApiOperation({ summary: 'Facilities for autocomplete (optional `q` substring filter).' })
  @ApiOkResponse({ type: [AutocompleteOptionDto] })
  autocompleteFacilities(@Query() query: AutocompleteQueryDto): Promise<AutocompleteOptionDto[]> {
    return this.restaurantsService.autocompleteFacilities(query.q, query.limit);
  }

  @Get(':restaurantId')
  @ApiParam({ type: 'number', name: 'restaurantId' })
  @ApiOperation({ summary: 'Get restaurant details by ID.' })
  @ApiOkResponse({ type: RestaurantDetailsDto })
  @ApiNotFoundResponse({ description: 'Restaurant not found.' })
  getRestaurantById(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<RestaurantDetailsDto> {
    return this.restaurantsService.getRestaurantById(restaurantId);
  }
}
