import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, notInArray, or, sql, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { DatabaseService } from 'src/database/database.service';
import { SortDirection } from 'src/_utils/dto/requests/paginated-query.dto';
import { SearchRestaurantsQueryDto } from './_utils/dto/request/search-restaurants.query.dto';
import { AutocompleteOptionDto } from './_utils/dto/response/autocomplete-option.dto';
import { GetRestaurantsPaginatedDto } from './_utils/dto/response/get-restaurants-paginated.dto';
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
  constructor(private readonly databaseService: DatabaseService) {}

  searchRestaurants = async (query: SearchRestaurantsQueryDto) => {
    const whereClauses = [
      this.getTextClause(query),
      this.getCityClause(query),
      this.getCountryClause(query),
      this.getCuisinesClause(query),
      this.getFacilitiesClause(query),
      this.getAwardsClause(query),
      this.getGreenStarClause(query),
      this.getPricesClause(query),
    ].filter(Boolean);

    const whereExpression = whereClauses.length > 0 ? and(...whereClauses) : undefined;
    const sortAsc = query.sortDirection === SortDirection.ASC;
    const orderByDir = sortAsc ? asc : desc;

    const starsForSort = sql<number | null>`(
      SELECT max(${restaurantAwards.starsCount})
      FROM ${restaurantAwards}
      WHERE ${restaurantAwards.restaurantId} = ${restaurants.id}
    )`;

    const totalQuery = this.databaseService.db
      .select({ count: sql<number>`count(*)` })
      .from(restaurants)
      .innerJoin(cities, eq(cities.id, restaurants.cityId))
      .innerJoin(countries, eq(countries.id, cities.countryId))
      .where(whereExpression);

    const hasGreenStarSql = sql<boolean>`coalesce((
      SELECT bool_or(${awardTypes.code} = 'GREEN_STAR')
      FROM ${restaurantAwards}
      INNER JOIN ${awardTypes} ON ${awardTypes.id} = ${restaurantAwards.awardTypeId}
      WHERE ${restaurantAwards.restaurantId} = ${restaurants.id}
    ), false)`;

    const cuisinesAgg = sql<string[]>`coalesce((
      SELECT array_agg(${cuisines.name} ORDER BY ${cuisines.name})
      FROM ${restaurantCuisines}
      INNER JOIN ${cuisines} ON ${cuisines.id} = ${restaurantCuisines.cuisineId}
      WHERE ${restaurantCuisines.restaurantId} = ${restaurants.id}
    ), ARRAY[]::text[])`;

    const facilitiesAgg = sql<string[]>`coalesce((
      SELECT array_agg(${facilities.name} ORDER BY ${facilities.name})
      FROM ${restaurantFacilities}
      INNER JOIN ${facilities} ON ${facilities.id} = ${restaurantFacilities.facilityId}
      WHERE ${restaurantFacilities.restaurantId} = ${restaurants.id}
    ), ARRAY[]::text[])`;

    const rowsQuery = this.databaseService.db
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
        city: cities.name,
        country: countries.name,
        stars: sql<number | null>`(
          SELECT max(${restaurantAwards.starsCount})
          FROM ${restaurantAwards}
          WHERE ${restaurantAwards.restaurantId} = ${restaurants.id}
        )`,
        hasGreenStar: hasGreenStarSql,
        cuisines: cuisinesAgg,
        facilities: facilitiesAgg,
        priceLevel: restaurants.priceLevel,
      })
      .from(restaurants)
      .innerJoin(cities, eq(cities.id, restaurants.cityId))
      .innerJoin(countries, eq(countries.id, cities.countryId))
      .where(whereExpression)
      .orderBy(
        query.sortBy === 'createdAt'
          ? orderByDir(restaurants.createdAt)
          : query.sortBy === 'stars'
            ? orderByDir(starsForSort)
            : orderByDir(restaurants.name),
        asc(restaurants.id),
      )
      .limit(query.limit)
      .offset(query.skip);

    const [totalRows, rows] = await Promise.all([totalQuery, rowsQuery]);

    return new GetRestaurantsPaginatedDto(rows, query, totalRows[0]?.count ?? 0);
  };

  private getSafeAutocompleteTerm = (q: string | undefined) => {
    const trimmed = q?.trim();
    if (!trimmed) {
      return undefined;
    }
    const safe = trimmed.replace(/[%_]/g, '');
    return safe || undefined;
  };

  private buildAutocompletePattern = (q: string | undefined) => {
    const safe = this.getSafeAutocompleteTerm(q);
    return safe ? `%${safe}%` : undefined;
  };

  /**
   * 0 = whole label or any token (split on spaces / commas / slashes / hyphens) starts with the term
   * 1 = contains term but no "prefix" match (neither on full string nor on a word)
   * 2 = fallback
   */
  private autocompleteNameTokensStartWith = (nameColumn: PgColumn, prefix: string) =>
    sql`EXISTS (
      SELECT 1
      FROM unnest(
        string_to_array(
          trim(
            regexp_replace(
              regexp_replace(cast(${nameColumn} as text), E'[,\\-–—/]+', ' ', 'g'),
              E'\\s+',
              ' ',
              'g'
            )
          ),
          ' '
        )
      ) AS t(token)
      WHERE btrim(t.token) <> '' AND t.token ILIKE ${prefix}
    )`;

  private autocompleteNameMatchPriority = (
    nameColumn: PgColumn,
    safe: string,
    options?: { normalizedColumn?: PgColumn },
  ): SQL => {
    const prefix = `${safe}%`;
    const contains = `%${safe}%`;
    const norm = options?.normalizedColumn;
    if (norm) {
      return sql`(
        CASE
          WHEN ${nameColumn} ILIKE ${prefix}
            OR ${norm} ILIKE ${prefix}
            OR ${this.autocompleteNameTokensStartWith(nameColumn, prefix)}
            OR ${this.autocompleteNameTokensStartWith(norm, prefix)}
          THEN 0
          WHEN ${nameColumn} ILIKE ${contains} OR ${norm} ILIKE ${contains}
          THEN 1
          ELSE 2
        END
      )`;
    }
    return sql`(
      CASE
        WHEN ${nameColumn} ILIKE ${prefix} OR ${this.autocompleteNameTokensStartWith(nameColumn, prefix)}
        THEN 0
        WHEN ${nameColumn} ILIKE ${contains}
        THEN 1
        ELSE 2
      END
    )`;
  };

  autocompleteCountries = async (q: string | undefined, limit: number): Promise<AutocompleteOptionDto[]> => {
    const pattern = this.buildAutocompletePattern(q);
    const safe = this.getSafeAutocompleteTerm(q);
    const query = this.databaseService.db
      .select({ id: countries.id, name: countries.name })
      .from(countries)
      .where(pattern ? ilike(countries.name, pattern) : undefined);
    if (safe) {
      return query
        .orderBy(asc(this.autocompleteNameMatchPriority(countries.name, safe)), asc(countries.name))
        .limit(limit)
        .then(rows => rows.map(r => ({ id: r.id, name: r.name })));
    }
    return query.orderBy(asc(countries.name)).limit(limit).then(rows => rows.map(r => ({ id: r.id, name: r.name })));
  };

  autocompleteCities = async (
    q: string | undefined,
    limit: number,
    countryId?: number,
  ): Promise<AutocompleteOptionDto[]> => {
    const pattern = this.buildAutocompletePattern(q);
    const safe = this.getSafeAutocompleteTerm(q);
    const byCountry = countryId !== undefined && countryId !== null ? eq(cities.countryId, countryId) : undefined;
    const byName = pattern ? ilike(cities.name, pattern) : undefined;
    const whereExpr =
      byCountry && byName
        ? and(byCountry, byName)
        : byCountry
          ? byCountry
          : byName
            ? byName
            : undefined;
    const query = this.databaseService.db.select({ id: cities.id, name: cities.name }).from(cities).where(whereExpr);
    if (safe) {
      return query
        .orderBy(asc(this.autocompleteNameMatchPriority(cities.name, safe)), asc(cities.name))
        .limit(limit)
        .then(rows => rows.map(r => ({ id: r.id, name: r.name })));
    }
    return query.orderBy(asc(cities.name)).limit(limit).then(rows => rows.map(r => ({ id: r.id, name: r.name })));
  };

  autocompleteCuisines = async (q: string | undefined, limit: number): Promise<AutocompleteOptionDto[]> => {
    const pattern = this.buildAutocompletePattern(q);
    const safe = this.getSafeAutocompleteTerm(q);
    const query = this.databaseService.db
      .select({ id: cuisines.id, name: cuisines.name })
      .from(cuisines)
      .where(
        pattern
          ? or(ilike(cuisines.name, pattern), ilike(cuisines.normalizedName, pattern))
          : undefined,
      );
    if (safe) {
      return query
        .orderBy(
          asc(
            this.autocompleteNameMatchPriority(cuisines.name, safe, { normalizedColumn: cuisines.normalizedName }),
          ),
          asc(cuisines.name),
        )
        .limit(limit)
        .then(rows => rows.map(r => ({ id: r.id, name: r.name })));
    }
    return query.orderBy(asc(cuisines.name)).limit(limit).then(rows => rows.map(r => ({ id: r.id, name: r.name })));
  };

  autocompleteFacilities = async (q: string | undefined, limit: number): Promise<AutocompleteOptionDto[]> => {
    const pattern = this.buildAutocompletePattern(q);
    const safe = this.getSafeAutocompleteTerm(q);
    const query = this.databaseService.db
      .select({ id: facilities.id, name: facilities.name })
      .from(facilities)
      .where(
        pattern
          ? or(ilike(facilities.name, pattern), ilike(facilities.normalizedName, pattern))
          : undefined,
      );
    if (safe) {
      return query
        .orderBy(
          asc(
            this.autocompleteNameMatchPriority(facilities.name, safe, { normalizedColumn: facilities.normalizedName }),
          ),
          asc(facilities.name),
        )
        .limit(limit)
        .then(rows => rows.map(r => ({ id: r.id, name: r.name })));
    }
    return query.orderBy(asc(facilities.name)).limit(limit).then(rows => rows.map(r => ({ id: r.id, name: r.name })));
  };

  getRestaurantById = async (id: number) => {
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
        city: cities.name,
        country: countries.name,
        stars: sql<number | null>`max(${restaurantAwards.starsCount})`,
        hasGreenStar: sql<boolean>`bool_or(${awardTypes.code} = 'GREEN_STAR')`,
        cuisines: sql<string[]>`array_remove(array_agg(distinct ${cuisines.name}), null)`,
        facilities: sql<string[]>`array_remove(array_agg(distinct ${facilities.name}), null)`,
        priceLevel: restaurants.priceLevel,
      })
      .from(restaurants)
      .innerJoin(cities, eq(cities.id, restaurants.cityId))
      .innerJoin(countries, eq(countries.id, cities.countryId))
      .leftJoin(restaurantAwards, eq(restaurantAwards.restaurantId, restaurants.id))
      .leftJoin(restaurantCuisines, eq(restaurantCuisines.restaurantId, restaurants.id))
      .leftJoin(cuisines, eq(cuisines.id, restaurantCuisines.cuisineId))
      .leftJoin(restaurantFacilities, eq(restaurantFacilities.restaurantId, restaurants.id))
      .leftJoin(facilities, eq(facilities.id, restaurantFacilities.facilityId))
      .where(eq(restaurants.id, id))
      .groupBy(restaurants.id, cities.name, countries.name, restaurants.priceLevel)
      .limit(1);

    if (!result) {
      throw new NotFoundException('Restaurant not found');
    }

    return result;
  };

  private getTextClause = ({ search }: SearchRestaurantsQueryDto) =>
    search?.trim()
      ? or(ilike(restaurants.name, `%${search}%`), ilike(restaurants.description, `%${search}%`))
      : undefined;

  private getCityClause = (query: SearchRestaurantsQueryDto) => {
    if (query.cityId !== undefined && query.cityId !== null) {
      return eq(cities.id, query.cityId);
    }
    return undefined;
  };

  private getCountryClause = (query: SearchRestaurantsQueryDto) => {
    if (query.countryId !== undefined && query.countryId !== null) {
      return eq(cities.countryId, query.countryId);
    }
    return undefined;
  };

  private getCuisinesClause = (query: SearchRestaurantsQueryDto) =>
    query.cuisineIds?.length
      ? inArray(
          restaurants.id,
          this.databaseService.db
            .select({ id: restaurantCuisines.restaurantId })
            .from(restaurantCuisines)
            .where(inArray(restaurantCuisines.cuisineId, query.cuisineIds)),
        )
      : undefined;

  private getFacilitiesClause = (query: SearchRestaurantsQueryDto) =>
    query.facilityIds?.length
      ? inArray(
          restaurants.id,
          this.databaseService.db
            .select({ id: restaurantFacilities.restaurantId })
            .from(restaurantFacilities)
            .where(inArray(restaurantFacilities.facilityId, query.facilityIds)),
        )
      : undefined;

  private getAwardsClause = (query: SearchRestaurantsQueryDto) => {
    const { awardCode, minStars, maxStars } = query;
    const awardClauses = [
      awardCode?.trim() ? eq(awardTypes.code, awardCode.trim()) : undefined,
      minStars ? sql`${restaurantAwards.starsCount} >= ${minStars}` : undefined,
      maxStars ? sql`${restaurantAwards.starsCount} <= ${maxStars}` : undefined,
    ].filter(Boolean);

    if (!awardClauses.length) {
      return undefined;
    }

    return inArray(
      restaurants.id,
      this.databaseService.db
        .select({ id: restaurantAwards.restaurantId })
        .from(restaurantAwards)
        .innerJoin(awardTypes, eq(awardTypes.id, restaurantAwards.awardTypeId))
        .where(and(...awardClauses)),
    );
  };

  private getGreenStarClause = (query: SearchRestaurantsQueryDto) => {
    if (query.greenStar === undefined) {
      return undefined;
    }
    const withGreen = this.databaseService.db
      .select({ id: restaurantAwards.restaurantId })
      .from(restaurantAwards)
      .innerJoin(awardTypes, eq(awardTypes.id, restaurantAwards.awardTypeId))
      .where(eq(awardTypes.code, 'GREEN_STAR'));
    if (query.greenStar) {
      return inArray(restaurants.id, withGreen);
    }
    return notInArray(restaurants.id, withGreen);
  };

  private getPricesClause = ({ minPriceLevel, maxPriceLevel }: SearchRestaurantsQueryDto) => {
    const priceClauses = [
      minPriceLevel ? sql`${restaurants.priceLevel} >= ${minPriceLevel}` : undefined,
      maxPriceLevel ? sql`${restaurants.priceLevel} <= ${maxPriceLevel}` : undefined,
    ].filter(Boolean);

    return priceClauses.length > 0 ? and(...priceClauses) : undefined;
  };
}
