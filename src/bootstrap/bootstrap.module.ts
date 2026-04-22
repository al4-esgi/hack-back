import { Module } from "@nestjs/common";
import { BootstrapService } from "./bootstrap.service";
import { RestaurantsModule } from "src/restaurants/restaurants.module";

@Module({
  imports: [RestaurantsModule],
  providers: [BootstrapService],
})
export class BootstrapModule {}
