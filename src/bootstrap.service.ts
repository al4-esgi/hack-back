import { Injectable, Logger } from '@nestjs/common';
import { exit } from 'process';
import { RestaurantImportService } from 'src/restaurants/import/restaurant-import.service';

@Injectable()
export class BootstrapService {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(private readonly restaurantImportService: RestaurantImportService) {}

  run = async (): Promise<void> => {
    this.logger.log('Running startup bootstrap tasks...');
    try {
      const csvPath = `${process.cwd()}/michelin_my_maps.csv`;
      const sourceName = csvPath.split('/').pop() ?? 'michelin_my_maps.csv';
      const sourceHash = await this.restaurantImportService.getFileHash(csvPath);
      const alreadyDone = await this.restaurantImportService.hasSuccessfulImport(sourceName, sourceHash);
      if (alreadyDone) {
        this.logger.log('Restaurant import skipped: same file hash already imported successfully.');
        this.logger.log('Startup bootstrap tasks completed.');
        return;
      }

      this.logger.log('Launching restaurant bootstrap import...');
      const stats = await this.restaurantImportService.runImport(csvPath, { strictCuisine: false });
      this.logger.log(
        `Restaurant import completed: rows=${stats.rowsRead}, restaurants=${stats.restaurantsUpserted}, unknownCuisines=${stats.unknownCuisines}`,
      );
      this.logger.log('Startup bootstrap tasks completed.');
      return;
    }
    catch (error) {
      if (this.isMissingTablesError(error)) {
        this.logger.error('Restaurant import tables are missing. Run `pnpm run db:migrate` then restart the app.');
        exit(1);
      }
      throw error;
    }
  };

  private isMissingTablesError = (error: unknown): boolean => {
    const maybe = error as { cause?: { code?: string; table?: string }; message?: string };
    return maybe?.cause?.code === '42P01' || maybe?.message?.includes('relation "ingestion_logs" does not exist') === true;
  };
}

