import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DatabaseService } from 'src/database/database.service';
import { AutocompleteOptionDto } from 'src/_utils/dto/responses/autocomplete-option.dto';
import { AutocompleteHelper } from 'src/_shared/autocomplete/autocomplete.helper';
import { GREEN_STAR_CODE } from './_constants';
import { RestaurantDetailsDto } from './_utils/dto/response/restaurant-details.dto';
import {
  awardTypes,
  cities,
  countries,
  cuisines,
  facilities,
  restaurantAwards,
  restaurantCuisines,
  restaurantFacilities,
  restaurants,
} from './entities';

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly autocompleteHelper: AutocompleteHelper,
  ) {}

  getRestaurantById = async (id: number): Promise<RestaurantDetailsDto> => {
    const [result] = await this.databaseService.db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        address: restaurants.address,
        description: restaurants.description,
        sourceUrl: restaurants.sourceUrl,
        websiteUrl: restaurants.websiteUrl,
        latitude: restaurants.latitude,
        longitude: restaurants.longitude,
        phoneNumber: restaurants.phoneNumber,
        createdAt: restaurants.createdAt,
        cityId: cities.id,
        city: cities.name,
        countryId: countries.id,
        country: countries.name,
        awardCode: sql<string | null>`(
          SELECT ${awardTypes.code}
          FROM ${restaurantAwards}
          INNER JOIN ${awardTypes} ON ${awardTypes.id} = ${restaurantAwards.awardTypeId}
          WHERE ${restaurantAwards.restaurantId} = ${restaurants.id}
          ORDER BY CASE WHEN ${awardTypes.code} = ${GREEN_STAR_CODE} THEN 1 ELSE 0 END, ${awardTypes.code}
          LIMIT 1
        )`,
        stars: sql<number | null>`(
          SELECT MAX(${restaurantAwards.starsCount})
          FROM ${restaurantAwards}
          WHERE ${restaurantAwards.restaurantId} = ${restaurants.id}
        )`,
        hasGreenStar: sql<boolean>`coalesce((
          SELECT BOOL_OR(${awardTypes.code} = ${GREEN_STAR_CODE})
          FROM ${restaurantAwards}
          INNER JOIN ${awardTypes} ON ${awardTypes.id} = ${restaurantAwards.awardTypeId}
          WHERE ${restaurantAwards.restaurantId} = ${restaurants.id}
        ), false)`,
        cuisines: this.cuisinesAggSql,
        facilities: this.facilitiesAggSql,
        priceLevel: restaurants.priceLevel,
      })
      .from(restaurants)
      .innerJoin(cities, eq(cities.id, restaurants.cityId))
      .innerJoin(countries, eq(countries.id, cities.countryId))
      .where(eq(restaurants.id, id))
      .limit(1);

    if (!result) {
      throw new NotFoundException('Restaurant not found');
    }

    return result as RestaurantDetailsDto;
  };

  autocompleteCuisines = (q: string | undefined, limit: number): Promise<AutocompleteOptionDto[]> =>
    this.autocompleteHelper.autocompleteOptions({
      table: cuisines,
      idColumn: cuisines.id,
      nameColumn: cuisines.name,
      normalizedColumn: cuisines.normalizedName,
      q,
      limit,
    });

  autocompleteFacilities = (q: string | undefined, limit: number): Promise<AutocompleteOptionDto[]> =>
    this.autocompleteHelper.autocompleteOptions({
      table: facilities,
      idColumn: facilities.id,
      nameColumn: facilities.name,
      normalizedColumn: facilities.normalizedName,
      q,
      limit,
    });

  private readonly cuisinesAggSql = sql<string[]>`coalesce((
    SELECT array_agg(${cuisines.name} ORDER BY ${cuisines.name})
    FROM ${restaurantCuisines}
    INNER JOIN ${cuisines} ON ${cuisines.id} = ${restaurantCuisines.cuisineId}
    WHERE ${restaurantCuisines.restaurantId} = ${restaurants.id}
  ), ARRAY[]::text[])`;

  private readonly facilitiesAggSql = sql<string[]>`coalesce((
    SELECT array_agg(${facilities.name} ORDER BY ${facilities.name})
    FROM ${restaurantFacilities}
    INNER JOIN ${facilities} ON ${facilities.id} = ${restaurantFacilities.facilityId}
    WHERE ${restaurantFacilities.restaurantId} = ${restaurants.id}
  ), ARRAY[]::text[])`;
}
