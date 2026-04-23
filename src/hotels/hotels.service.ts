import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DatabaseService } from 'src/database/database.service';
import { AutocompleteOptionDto } from 'src/_utils/dto/responses/autocomplete-option.dto';
import { AutocompleteHelper } from 'src/_shared/autocomplete/autocomplete.helper';
import { cities } from 'src/restaurants/entities/cities.entity';
import { countries } from 'src/restaurants/entities/countries.entity';
import { hotelAmenities } from './hotel-amenities.entity';
import { hotelHotelAmenities } from './hotel-hotel-amenities.entity';
import { hotels } from './hotels.entity';
import { HotelDetailsDto } from './_utils/dto/response/hotel-details.dto';

@Injectable()
export class HotelsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly autocompleteHelper: AutocompleteHelper,
  ) {}

  private readonly amenitiesAggSql = sql<string[]>`coalesce((
    SELECT array_agg(${hotelAmenities.name} ORDER BY ${hotelAmenities.name})
    FROM ${hotelHotelAmenities}
    INNER JOIN ${hotelAmenities} ON ${hotelAmenities.id} = ${hotelHotelAmenities.amenityId}
    WHERE ${hotelHotelAmenities.hotelId} = ${hotels.id}
  ), ARRAY[]::text[])`;

  getHotelById = async (id: number): Promise<HotelDetailsDto> => {
    const [result] = await this.databaseService.db
      .select({
        id: hotels.id,
        name: hotels.name,
        address: hotels.address,
        content: hotels.content,
        canonicalUrl: hotels.canonicalUrl,
        mainImageUrl: hotels.mainImageUrl,
        lat: hotels.lat,
        lng: hotels.lng,
        phone: hotels.phone,
        postalCode: hotels.postalCode,
        neighborhood: hotels.neighborhood,
        createdAt: hotels.createdAt,
        cityId: cities.id,
        city: cities.name,
        countryId: countries.id,
        country: countries.name,
        distinctions: hotels.distinctions,
        isPlus: sql<boolean>`coalesce(${hotels.isPlus}, false)`,
        sustainableHotel: sql<boolean>`coalesce(${hotels.sustainableHotel}, false)`,
        bookable: sql<boolean>`coalesce(${hotels.bookable}, false)`,
        numRooms: hotels.numRooms,
        checkInTime: hotels.checkInTime,
        checkOutTime: hotels.checkOutTime,
        languages: hotels.languages,
        amenities: this.amenitiesAggSql,
      })
      .from(hotels)
      .leftJoin(cities, eq(cities.id, hotels.cityId))
      .leftJoin(countries, eq(countries.id, hotels.countryId))
      .where(eq(hotels.id, id))
      .limit(1);

    if (!result) {
      throw new NotFoundException('Hotel not found');
    }

    return result as unknown as HotelDetailsDto;
  };

  autocompleteAmenities = (q: string | undefined, limit: number): Promise<AutocompleteOptionDto[]> =>
    this.autocompleteHelper.autocompleteOptions({
      table: hotelAmenities,
      idColumn: hotelAmenities.id,
      nameColumn: hotelAmenities.name,
      normalizedColumn: hotelAmenities.normalizedName,
      q,
      limit,
    });
}
