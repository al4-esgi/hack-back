import { PaginatedQueryDto } from 'src/_utils/dto/requests/paginated-query.dto';
import { PaginationDto } from 'src/_utils/dto/responses/pagination.dto';

type RestaurantSearchItem = {
  id: number;
  name: string;
  address: string;
  description: string;
  sourceUrl: string;
  websiteUrl: string | null;
  latitude: string;
  longitude: string;
  phoneNumber: string | null;
  createdAt: Date;
  city: string;
  country: string;
  stars: number | null;
  hasGreenStar: boolean;
  cuisines: string[];
  facilities: string[];
  priceLevel: number | null;
};

export class GetRestaurantsPaginatedDto extends PaginationDto {
  restaurants: RestaurantSearchItem[];

  constructor(restaurants: RestaurantSearchItem[], paginatedQuery: PaginatedQueryDto, totalItemsCount: number) {
    super(paginatedQuery, totalItemsCount);
    this.restaurants = restaurants;
  }
}
