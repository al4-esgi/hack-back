import { Module } from '@nestjs/common';
import { RestaurantImportService } from 'src/restaurants/import/restaurant-import.service';

@Module({
  providers: [RestaurantImportService],
  exports: [RestaurantImportService],
})
export class RestaurantsModule {}

