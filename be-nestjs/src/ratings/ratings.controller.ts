import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RatingsService } from './ratings.service.js';
import { CreateRatingDto } from './dto/create-rating.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

interface CurrentUserType {
  id: string;
  role: string;
  tenant_id: string | null;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly service: RatingsService) {}

  @Post('requests/:requestId/rate')
  createRating(
    @Param('requestId') requestId: string,
    @Body() dto: CreateRatingDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.createRating(requestId, dto, user);
  }

  @Get('staff/:staffId/ratings')
  getStaffRatings(@Param('staffId') staffId: string, @Query() pagination: PaginationDto) {
    return this.service.getStaffRatings(staffId, pagination);
  }
}
