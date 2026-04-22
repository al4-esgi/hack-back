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
import { HotelDetailsDto } from './_utils/dto/response/hotel-details.dto';
import { HotelsService } from './hotels.service';

@ApiTags('Hotels')
@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get('filters/amenities')
  @ApiOperation({ summary: 'Hotel amenities for autocomplete (optional `q` substring filter).' })
  @ApiOkResponse({ type: [AutocompleteOptionDto] })
  autocompleteAmenities(@Query() query: AutocompleteQueryDto): Promise<AutocompleteOptionDto[]> {
    return this.hotelsService.autocompleteAmenities(query.q, query.limit);
  }

  @Get(':hotelId')
  @ApiParam({ type: 'number', name: 'hotelId' })
  @ApiOperation({ summary: 'Get hotel details by ID.' })
  @ApiOkResponse({ type: HotelDetailsDto })
  @ApiNotFoundResponse({ description: 'Hotel not found.' })
  getHotelById(@Param('hotelId', ParseIntPipe) hotelId: number): Promise<HotelDetailsDto> {
    return this.hotelsService.getHotelById(hotelId);
  }
}
