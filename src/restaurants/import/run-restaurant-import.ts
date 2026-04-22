import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { RestaurantImportService } from 'src/restaurants/import/restaurant-import.service';

const getArgValue = (argName: string): string | undefined => {
  const found = process.argv.find(arg => arg.startsWith(`${argName}=`));
  return found?.split('=').slice(1).join('=');
};

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  try {
    const importService = app.get(RestaurantImportService);
    const csvPath = getArgValue('--file') ?? `${process.cwd()}/michelin_my_maps.csv`;
    const strictCuisine = (getArgValue('--strict-cuisine') ?? 'false') === 'true';
    const stats = await importService.runImport(csvPath, { strictCuisine });
    console.log(
      `Restaurant import done. rows=${stats.rowsRead}, restaurants=${stats.restaurantsUpserted}, unknownCuisines=${stats.unknownCuisines}`,
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch(error => {
  console.error(error);
  process.exit(1);
});

