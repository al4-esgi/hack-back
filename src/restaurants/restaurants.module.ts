import { Module } from '@nestjs/common';
import { RestaurantImportService } from 'src/restaurants/import/restaurant-import.service';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';

@Module({
  controllers: [RestaurantsController],
  providers: [RestaurantImportService, RestaurantsService],
  exports: [RestaurantImportService, RestaurantsService],
})
export class RestaurantsModule {}

