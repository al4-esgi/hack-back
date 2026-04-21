import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import { and, desc, eq } from 'drizzle-orm';
import { DatabaseService } from 'src/database/database.service';
import {
  awardTypes,
  cities,
  countries,
  cuisines,
  facilities,
  ingestionLogs,
  restaurantAwards,
  restaurantCuisines,
  restaurantFacilities,
  restaurants,
} from 'src/restaurants/entities';
import { readCsvAsObjects } from './csv-reader';
import { mapRestaurantRow } from './restaurant-row.mapper';
import { normalizeKey, normalizeLabel } from './normalizers';

type ImportOptions = {
  strictCuisine: boolean;
};

type ImportStats = {
  rowsRead: number;
  restaurantsUpserted: number;
  unknownCuisines: number;
};

@Injectable()
export class RestaurantImportService {
  private readonly logger = new Logger(RestaurantImportService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  private readonly countryCache = new Map<string, number>();
  private readonly cityCache = new Map<string, number>();
  private readonly cuisineCache = new Map<string, { id: number; name: string }>();
  private readonly facilityCache = new Map<string, number>();
  private readonly awardTypeCache = new Map<string, number>();

  getFileHash = async (filePath: string): Promise<string> => {
    const content = await readFile(filePath);
    return createHash('sha256').update(content).digest('hex');
  };

  hasSuccessfulImport = async (sourceName: string, sourceHash: string): Promise<boolean> => {
    const latest = await this.databaseService.db
      .select()
      .from(ingestionLogs)
      .where(and(eq(ingestionLogs.sourceName, sourceName), eq(ingestionLogs.sourceHash, sourceHash)))
      .orderBy(desc(ingestionLogs.importedAt))
      .limit(1);

    return latest[0]?.status === 'SUCCESS';
  };

  runImport = async (csvPath: string, options: ImportOptions): Promise<ImportStats> => {
    const rows = await readCsvAsObjects(csvPath);
    const sourceName = csvPath.split('/').pop() ?? 'michelin_my_maps.csv';
    const sourceHash = await this.getFileHash(csvPath);

    const stats: ImportStats = { rowsRead: rows.length, restaurantsUpserted: 0, unknownCuisines: 0 };
    const warningMessages: string[] = [];

    try {
      await this.bootstrapTaxonomy();
      await this.ensureAwardTypes();

      for (const row of rows) {
        await this.databaseService.db.transaction(async tx => {
          const mapped = mapRestaurantRow(row);
          const countryId = await this.ensureCountry(mapped.location.country, tx);
          const cityId = await this.ensureCity(mapped.location.city, countryId, tx);
          const awardTypeId = await this.ensureAwardType(mapped.award.code, tx);
          const restaurantId = await this.upsertRestaurant(
            {
              name: mapped.name,
              address: mapped.address,
              cityId,
              latitude: mapped.latitude,
              longitude: mapped.longitude,
              phoneNumber: mapped.phoneNumber,
              sourceUrl: mapped.sourceUrl,
              websiteUrl: mapped.websiteUrl,
              description: mapped.description,
              priceLevel: mapped.rankPrice,
            },
            tx,
          );

          await this.replaceRestaurantAward(
            {
              restaurantId,
              awardTypeId,
              starsCount: mapped.award.starsCount,
            },
            tx,
          );

          if (mapped.greenStar) {
            const greenStarAwardTypeId = await this.ensureAwardType('GREEN_STAR', tx);
            await this.replaceRestaurantAward(
              {
                restaurantId,
                awardTypeId: greenStarAwardTypeId,
                starsCount: null,
              },
              tx,
            );
          }

          const cuisineIds: number[] = [];
          for (const cuisineName of mapped.cuisines) {
            const normalizedKey = normalizeKey(cuisineName);
            const existingCuisine = this.cuisineCache.get(normalizedKey);
            if (!existingCuisine) {
              if (options.strictCuisine) {
                throw new Error(`Unknown cuisine "${cuisineName}" with strict mode enabled`);
            }
              const createdId = await this.createCuisine(cuisineName, tx);
              this.cuisineCache.set(normalizedKey, { id: createdId, name: cuisineName });
              stats.unknownCuisines += 1;
              warningMessages.push(`Unknown cuisine auto-created: ${cuisineName}`);
              cuisineIds.push(createdId);
            } else {
              cuisineIds.push(existingCuisine.id);
            }
          }

          await tx.delete(restaurantCuisines).where(eq(restaurantCuisines.restaurantId, restaurantId));
          if (cuisineIds.length) {
            await tx.insert(restaurantCuisines).values(cuisineIds.map(cuisineId => ({ restaurantId, cuisineId })));
          }

          const facilityIds: number[] = [];
          for (const facilityName of mapped.facilities) {
            const normalizedKey = normalizeKey(facilityName);
            const cachedId = this.facilityCache.get(normalizedKey);
            if (cachedId) {
              facilityIds.push(cachedId);
              continue;
            }
            facilityIds.push(await this.ensureFacility(facilityName, tx));
          }

          await tx.delete(restaurantFacilities).where(eq(restaurantFacilities.restaurantId, restaurantId));
          if (facilityIds.length) {
            await tx
              .insert(restaurantFacilities)
              .values(facilityIds.map(facilityId => ({ restaurantId, facilityId })));
          }
        });
        stats.restaurantsUpserted += 1;
      }

      await this.databaseService.db.insert(ingestionLogs).values({
        sourceName,
        sourceHash,
        rowCount: stats.rowsRead,
        status: 'SUCCESS',
        message: warningMessages.length ? warningMessages.slice(0, 30).join(' | ') : null,
      });
      this.logger.log(
        `Import done. rows=${stats.rowsRead}, restaurants=${stats.restaurantsUpserted}, unknownCuisines=${stats.unknownCuisines}`,
      );
      return stats;
    } catch (error) {
      await this.databaseService.db.insert(ingestionLogs).values({
        sourceName,
        sourceHash,
        rowCount: stats.rowsRead,
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Unknown import error',
      });
      throw error;
    }
  };

  private bootstrapTaxonomy = async (): Promise<void> => {
    const content = await readFile(`${process.cwd()}/cuisine_categories.md`, 'utf-8');
    const cuisineNames = content
      .split('\n')
      .map(line => line.trim().match(/^\d+\.\s+(.*)$/)?.[1]?.trim())
      .filter((line): line is string => Boolean(line));

    for (const cuisineName of cuisineNames) {
      const normalizedName = normalizeKey(cuisineName);
      const [saved] = await this.databaseService.db
        .insert(cuisines)
        .values({ name: normalizeLabel(cuisineName), normalizedName })
        .onConflictDoUpdate({
          target: cuisines.normalizedName,
          set: { name: normalizeLabel(cuisineName), updatedAt: new Date() },
        })
        .returning({ id: cuisines.id, name: cuisines.name });
      this.cuisineCache.set(normalizedName, { id: saved.id, name: saved.name });
    }
  };

  private ensureCountry = async (countryName: string, tx: typeof this.databaseService.db): Promise<number> => {
    const normalizedCountryName = normalizeLabel(countryName);
    const key = normalizeKey(normalizedCountryName);
    const cachedId = this.countryCache.get(key);
    if (cachedId) return cachedId;

    const existingByName = await tx.select({ id: countries.id }).from(countries).where(eq(countries.name, normalizedCountryName)).limit(1);
    if (existingByName[0]) {
      this.countryCache.set(key, existingByName[0].id);
      return existingByName[0].id;
    }

    const [saved] = await tx
      .insert(countries)
      .values({ name: normalizedCountryName })
      .onConflictDoUpdate({ target: countries.name, set: { updatedAt: new Date() } })
      .returning({ id: countries.id });
    this.countryCache.set(key, saved.id);
    return saved.id;
  };

  private ensureCity = async (cityName: string, countryId: number, tx: typeof this.databaseService.db): Promise<number> => {
    const key = `${countryId}:${normalizeKey(cityName)}`;
    const cachedId = this.cityCache.get(key);
    if (cachedId) return cachedId;
    const [saved] = await tx
      .insert(cities)
      .values({ name: normalizeLabel(cityName), countryId })
      .onConflictDoUpdate({ target: [cities.countryId, cities.name], set: { updatedAt: new Date() } })
      .returning({ id: cities.id });
    this.cityCache.set(key, saved.id);
    return saved.id;
  };

  private ensureFacility = async (facilityName: string, tx: typeof this.databaseService.db): Promise<number> => {
    const key = normalizeKey(facilityName);
    const cachedId = this.facilityCache.get(key);
    if (cachedId) return cachedId;
    const [saved] = await tx
      .insert(facilities)
      .values({ name: normalizeLabel(facilityName), normalizedName: key })
      .onConflictDoUpdate({ target: facilities.normalizedName, set: { updatedAt: new Date() } })
      .returning({ id: facilities.id });
    this.facilityCache.set(key, saved.id);
    return saved.id;
  };

  private createCuisine = async (cuisineName: string, tx: typeof this.databaseService.db): Promise<number> => {
    const normalizedName = normalizeKey(cuisineName);
    const [saved] = await tx
      .insert(cuisines)
      .values({ name: normalizeLabel(cuisineName), normalizedName })
      .onConflictDoUpdate({ target: cuisines.normalizedName, set: { updatedAt: new Date() } })
      .returning({ id: cuisines.id });
    return saved.id;
  };

  private ensureAwardType = async (awardCode: string, tx: typeof this.databaseService.db): Promise<number> => {
    const key = normalizeKey(awardCode);
    const cachedId = this.awardTypeCache.get(key);
    if (cachedId) return cachedId;
    const [saved] = await tx
      .insert(awardTypes)
      .values({ code: awardCode, label: awardCode })
      .onConflictDoUpdate({ target: awardTypes.code, set: { updatedAt: new Date() } })
      .returning({ id: awardTypes.id });
    this.awardTypeCache.set(key, saved.id);
    return saved.id;
  };

  private ensureAwardTypes = async (): Promise<void> => {
    for (const code of ['MICHELIN_STAR', 'BIB_GOURMAND', 'SELECTED', 'GREEN_STAR']) {
      await this.ensureAwardType(code, this.databaseService.db);
    }
  };

  private upsertRestaurant = async (
    row: {
      name: string;
      address: string;
      cityId: number;
      latitude: string;
      longitude: string;
      phoneNumber: string | null;
      sourceUrl: string;
      websiteUrl: string | null;
      description: string;
      priceLevel: number;
    },
    tx: typeof this.databaseService.db,
  ): Promise<number> => {
    const [saved] = await tx
      .insert(restaurants)
      .values(row)
      .onConflictDoUpdate({
        target: restaurants.sourceUrl,
        set: {
          name: row.name,
          address: row.address,
          cityId: row.cityId,
          latitude: row.latitude,
          longitude: row.longitude,
          phoneNumber: row.phoneNumber,
          websiteUrl: row.websiteUrl,
          description: row.description,
          priceLevel: row.priceLevel,
          updatedAt: new Date(),
        },
      })
      .returning({ id: restaurants.id });
    return saved.id;
  };

  private replaceRestaurantAward = async (
    row: { restaurantId: number; awardTypeId: number; starsCount: number | null },
    tx: typeof this.databaseService.db,
  ): Promise<void> => {
    await tx.delete(restaurantAwards).where(eq(restaurantAwards.restaurantId, row.restaurantId));
    await tx.insert(restaurantAwards).values(row);
  };
}

